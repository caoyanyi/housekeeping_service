-- 家政服务在线预约系统初始化数据

USE housekeeping_service;

-- 插入管理员数据（密码：admin123）
INSERT INTO admin (username, password, nickname, avatar, role, status)
VALUES ('admin', '$2y$10$Qmz49Uc4eS5p3h7cUv9W0e8zL2B3t4y5u6i7o8p9a0s1d2f3g4h5j6k7l', '超级管理员', '', 2, 1);

-- 插入分类数据
INSERT INTO categories (name, icon, sort_order, status)
VALUES 
('日常保洁', 'icon-baojie.png', 1, 1),
('深度清洁', 'icon-shendu.png', 2, 1),
('家电清洗', 'icon-jiadian.png', 3, 1),
('保姆月嫂', 'icon-baomu.png', 4, 1),
('搬家服务', 'icon-banJia.png', 5, 1);

-- 插入服务数据
INSERT INTO services (category_id, title, price, description, image_urls, duration, status)
VALUES 
(1, '日常家庭保洁', 120.00, '包含客厅、卧室、厨房、卫生间等区域的清洁，擦灰、拖地、整理等基础服务。', '["service1-1.jpg","service1-2.jpg"]', 120, 1),
(2, '全屋深度清洁', 280.00, '包含日常保洁内容，额外增加窗户清洁、家具缝隙清理、厨房重油污清洁等。', '["service2-1.jpg","service2-2.jpg"]', 240, 1),
(3, '空调清洗', 80.00, '室内机清洗、滤网清洗、蒸发器清洁消毒，有效去除异味和细菌。', '["service3-1.jpg","service3-2.jpg"]', 60, 1),
(4, '专业月嫂服务', 380.00, '专业月嫂提供24小时母婴护理、产后恢复指导、新生儿喂养等服务。', '["service4-1.jpg","service4-2.jpg"]', 480, 1),
(5, '小型搬家服务', 300.00, '2小时内完成的小型搬家服务，包含3名工人和1辆货车。', '["service5-1.jpg","service5-2.jpg"]', 120, 1);

-- 插入测试用户数据（密码：123456）
INSERT INTO users (phone, password, nickname, avatar, gender, address, status)
VALUES 
('13800138001', '$2y$10$Qmz49Uc4eS5p3h7cUv9W0e8zL2B3t4y5u6i7o8p9a0s1d2f3g4h5j6k7l', '张三', '', 1, '北京市朝阳区建国路88号', 1),
('13800138002', '$2y$10$Qmz49Uc4eS5p3h7cUv9W0e8zL2B3t4y5u6i7o8p9a0s1d2f3g4h5j6k7l', '李四', '', 2, '上海市浦东新区陆家嘴环路1000号', 1);

-- 插入预约数据
INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time, contact_name, contact_phone, address, notes, status)
VALUES 
(1, 1, '2023-12-10', '10:00:00', '张三', '13800138001', '北京市朝阳区建国路88号', '请提前半小时到达', 'accepted'),
(2, 3, '2023-12-12', '14:30:00', '李四', '13800138002', '上海市浦东新区陆家嘴环路1000号', '有两台空调需要清洗', 'pending');
