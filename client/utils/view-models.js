const DEFAULT_SERVICE_IMAGE = '/static/images/empty.svg';

export const SERVICE_LIST_FILTERS_KEY = 'serviceListFilters';

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const text = value.trim();
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
  } catch (error) {
    // Ignore JSON parse errors and fall back to string split.
  }

  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasRichText(value = '') {
  return /<[^>]+>/.test(String(value));
}

export function formatCurrency(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) {
    return '0';
  }

  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

export function normalizeService(raw = {}) {
  const imageUrls = toArray(raw.image_urls || raw.images || raw.image || raw.cover);
  const title = safeString(raw.title || raw.name) || '家政服务';
  const description = safeString(raw.description || raw.content);
  const duration = Number(raw.duration || raw.service_duration || 0) || 0;

  let tags = [];
  if (Array.isArray(raw.tags)) {
    tags = raw.tags.filter(Boolean);
  } else if (typeof raw.tags === 'string') {
    tags = raw.tags
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!tags.length) {
    tags = [
      safeString(raw.category_name),
      duration ? `${duration}分钟` : '',
      raw.status === 1 ? '平台保障' : ''
    ].filter(Boolean);
  }

  let process = [];
  if (Array.isArray(raw.process)) {
    process = raw.process.filter(Boolean);
  } else if (typeof raw.process === 'string') {
    process = raw.process
      .split(/\n|,|;|；/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return {
    ...raw,
    title,
    name: title,
    description,
    plain_description: stripHtml(description),
    price: Number(raw.price || 0) || 0,
    duration,
    image_urls: imageUrls.length ? imageUrls : [DEFAULT_SERVICE_IMAGE],
    image: imageUrls[0] || DEFAULT_SERVICE_IMAGE,
    tags,
    process
  };
}

export function normalizeAppointmentStatus(status = 'pending') {
  const aliasMap = {
    confirmed: 'accepted',
    canceled: 'cancelled'
  };

  return aliasMap[status] || status || 'pending';
}

export function getAppointmentStatusText(status = 'pending') {
  const normalized = normalizeAppointmentStatus(status);
  const statusMap = {
    pending: '待接单',
    accepted: '已接单',
    completed: '已完成',
    cancelled: '已取消',
    rejected: '已拒绝',
    no_show: '未履约'
  };

  return statusMap[normalized] || '处理中';
}

export function normalizeAppointment(raw = {}) {
  const service = normalizeService(
    raw.service || {
      title: raw.service_title,
      price: raw.service_price,
      image_urls: raw.service_image_urls || raw.service_image || raw.image_urls,
      description: raw.service_description || ''
    }
  );

  const status = normalizeAppointmentStatus(raw.status);

  return {
    ...raw,
    status,
    status_text: getAppointmentStatusText(status),
    service,
    service_title: safeString(raw.service_title) || service.title,
    service_price: Number(raw.service_price ?? service.price ?? 0) || 0,
    service_image: raw.service_image || service.image,
    contact_phone: safeString(raw.contact_phone || raw.phone),
    notes: safeString(raw.notes || raw.remark),
    appointment_datetime: [raw.appointment_date, raw.appointment_time].filter(Boolean).join(' ')
  };
}

export function isValidPhone(phone = '') {
  return /^1[3-9]\d{9}$/.test(String(phone).trim());
}
