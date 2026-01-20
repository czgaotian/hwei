# 标签管理 - 前端需求文档

## 1. 概述

本文档描述博客 CMS 系统中「标签管理（Tag）」模块的前端实现需求，基于产品需求文档 3.3 章节。

### 1.1 目标用户

- 管理员（Admin）

### 1.2 核心功能

- 标签列表展示
- 创建新标签
- 编辑标签信息
- 删除标签
- 标签颜色管理

---

## 2. 页面结构

### 2.1 标签列表页（Tag List）

**路由：** `/tags`

#### 2.1.1 页面布局

- 顶部操作区
  - 【新建标签】按钮（Primary Button）
  - 搜索框：按标签名称搜索（Input.Search，支持服务端搜索）
- 标签列表区（Table）
  - 列定义：
    - **标签名称**（name）：显示名称及颜色标识（色块 + 文字）
    - **颜色**（color）：以色块形式展示，显示颜色值（如 #FF5733）
    - **文章数量**（articleCount）：显示该标签关联的文章数量（需从文章接口聚合）
    - **创建时间**（createdAt）：格式化显示
    - **更新时间**（updatedAt）：格式化显示
    - **操作**（actions）：
      - 【编辑】图标按钮
      - 【删除】图标按钮（带二次确认）
  - 分页配置：
    - 默认每页 10 条（pageSize: 10）
    - 支持切换每页显示数量：10, 20, 50
    - 显示总数和页码信息

#### 2.1.2 交互行为

1. **加载标签列表**
   - 页面初始化时，调用 `GET /tags` API
   - 传入查询参数：`page=1`, `pageSize=10`
   - 显示 Loading 状态
   - 根据返回的分页信息更新分页组件

2. **搜索操作**
   - 修改搜索关键词时，调用 `GET /tags` API 进行服务端搜索
   - 传入 `search` 查询参数，重置页码为第 1 页
   - 按标签名称进行模糊匹配（后端实现）
   - 支持实时搜索（建议使用防抖优化，延迟 500ms）

3. **分页操作**
   - 切换页码或每页显示数量时，调用 `GET /tags` API
   - 传入对应的 `page` 和 `pageSize` 参数
   - 保留当前搜索关键词

4. **分页操作**
   - 切换页码或每页显示数量时，调用 `GET /tags` API
   - 传入对应的 `page` 和 `pageSize` 参数
   - 保留当前搜索关键词

5. **新建标签**
   - 点击【新建标签】按钮
   - 打开新建标签 Modal

6. **编辑标签**
   - 点击【编辑】按钮
   - 打开编辑标签 Modal，填充当前标签数据

7. **删除标签**
   - 点击删除按钮
   - 弹出二次确认 Modal：
     - 若标签有关联文章："该标签关联了 {count} 篇文章，删除后文章将失去该标签，确定要删除吗？"
     - 若标签无关联文章："确定要删除标签「{name}」吗？此操作不可撤销。"
   - 确认后调用 `DELETE /tags/:id` API
   - 成功后：
     - 显示成功提示："标签删除成功"
     - 刷新当前页列表（若当前页无数据则跳转上一页）

#### 2.1.3 状态管理

```typescript
interface TagListState {
  tags: Tag[]; // 当前页标签列表
  loading: boolean;
  searchKeyword: string; // 搜索关键词
  pagination: {
    page: number; // 当前页码
    pageSize: number; // 每页数量
    total: number; // 总记录数
    totalPages: number; // 总页数
  };
  modalVisible: boolean;
  editingTag: Tag | null;
}
```

#### 2.1.4 API 对接

- **获取标签列表**

  ```
  GET /tags?page=1&pageSize=10&search=React

  Query Parameters:
  - page: 页码，默认 1
  - pageSize: 每页数量，默认 10
  - search: 搜索关键词，可选

  Response (200):
  {
    "data": Tag[], // 当前页标签数组
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 25, // 总记录数
      "totalPages": 3 // 总页数
    }
  }

  // 示例:
  {
    "data": [
      {
        "id": 1,
        "name": "React",
        "color": "#61DAFB",
        "createdAt": "2026-01-20T10:00:00Z",
        "updatedAt": "2026-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

- **删除标签**

  ```
  DELETE /tags/:id

  Response (200 - 成功):
  Tag // 返回被删除的标签对象
  {
    "id": 1,
    "name": "React",
    "color": "#61DAFB",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }

  Response (404 - 失败):
  "Tag not found" // 纯文本
  ```

---

### 2.2 标签创建/编辑 Modal

#### 2.2.1 Modal 设置

- **标题**：
  - 创建模式："新建标签"
  - 编辑模式："编辑标签"
- **宽度**：480px
- **底部按钮**：
  - 【取消】按钮（Default Button）
  - 【确定】按钮（Primary Button）

#### 2.2.2 表单字段

| 字段名 | 组件类型    | 规则                               | 说明                     |
| ------ | ----------- | ---------------------------------- | ------------------------ |
| name   | Input       | 必填，最大长度 50 字符，不允许重复 | 标签名称                 |
| color  | ColorPicker | 必填，默认值 #52C41A               | 标签颜色（用于前端展示） |

**表单布局**：

```
┌─────────────────────────────────────┐
│  标签名称 *                         │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  标签颜色 *                         │
│  ┌──┐ #52C41A                       │
│  │██│ [颜色选择器]                  │
│  └──┘                               │
└─────────────────────────────────────┘
```

#### 2.2.3 交互行为

1. **打开 Modal**
   - **创建模式**：
     - 表单为空
     - 颜色默认为 `#52C41A`（绿色）
   - **编辑模式**：
     - 表单填充当前标签数据
     - 允许修改名称和颜色

2. **颜色选择**
   - 使用 Ant Design 的 ColorPicker 组件
   - 支持预设颜色选择（推荐常用颜色）
   - 支持自定义十六进制颜色输入
   - 实时预览颜色效果

3. **表单验证**
   - 名称必填，不能为空
   - 名称不能超过 50 字符
   - 名称不能与已有标签重复（前端验证 + 后端验证）
   - 颜色必须是有效的十六进制颜色值

4. **提交表单**
   - 点击【确定】按钮
   - 进行前端验证
   - 验证通过后：
     - **创建模式**：调用 `POST /tags` API
     - **编辑模式**：调用 `PUT /tags/:id` API
   - 成功后：
     - 关闭 Modal
     - 显示成功提示："标签创建/更新成功"
     - 刷新标签列表
   - 失败则显示错误信息（如名称重复）

5. **取消操作**
   - 点击【取消】按钮或点击遮罩层关闭 Modal
   - 如表单有修改，弹出二次确认："确定要放弃当前编辑吗？"
   - 确认后关闭 Modal，放弃修改

#### 2.2.4 API 对接

- **创建标签**

  ```
  POST /tags

  Request:
  {
    "name": "React",
    "color": "#61DAFB"
  }

  Response (201 - 成功):
  Tag // 直接返回创建的标签对象
  {
    "id": 1,
    "name": "React",
    "color": "#61DAFB",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }

  Response (400 - 失败):
  "Failed to create tag: [error message]" // 纯文本
  ```

- **编辑标签**

  ```
  PUT /tags/:id

  Request:
  {
    "name": "React",
    "color": "#61DAFB"
  }

  Response (200 - 成功):
  Tag // 直接返回更新后的标签对象
  {
    "id": 1,
    "name": "React",
    "color": "#61DAFB",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:30:00Z"
  }

  Response (404 - 未找到):
  "Tag not found" // 纯文本

  Response (400 - 失败):
  "Failed to update tag: [error message]" // 纯文本
  ```

- **获取单个标签**

  ```
  GET /tags/:id

  Response (200 - 成功):
  Tag // 返回标签对象
  {
    "id": 1,
    "name": "React",
    "color": "#61DAFB",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }

  Response (404 - 未找到):
  "Tag not found" // 纯文本
  ```

---

## 3. 数据类型定义

### 3.1 Tag 类型

```typescript
interface Tag {
  id: number;
  name: string;
  color: string; // 十六进制颜色值，如 "#52C41A"
  articleCount?: number; // 关联的文章数量（列表接口返回）
  createdAt: string; // ISO 8601 格式
  updatedAt: string; // ISO 8601 格式
}
```

### 3.2 API Response 类型

```typescript
// 分页响应
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 列表响应
type TagListResponse = PaginatedResponse<Tag>;

// 单个标签响应 - 直接返回对象
type TagResponse = Tag;

// 错误响应 - 纯文本字符串
type ErrorResponse = string;

// API 调用示例
interface TagAPI {
  // GET /tags -> PaginatedResponse<Tag>
  getTags: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => Promise<PaginatedResponse<Tag>>;

  // GET /tags/:id -> Tag | 404
  getTag: (id: number) => Promise<Tag>;

  // POST /tags -> Tag (201) | string (400)
  createTag: (data: CreateTagInput) => Promise<Tag>;

  // PUT /tags/:id -> Tag (200) | string (404/400)
  updateTag: (id: number, data: UpdateTagInput) => Promise<Tag>;

  // DELETE /tags/:id -> Tag (200) | string (404)
  deleteTag: (id: number) => Promise<Tag>;
}

interface CreateTagInput {
  name: string;
  color: string;
}

interface UpdateTagInput {
  name?: string;
  color?: string;
}
```

---

## 4. 组件复用

### 4.1 TagItem 组件

**用途**：在文章列表、编辑页面等地方展示标签

**Props**：

```typescript
interface TagItemProps {
  tag: {
    name: string;
    color: string;
  };
  size?: "small" | "default" | "large";
  closable?: boolean; // 是否可关闭（用于选择器）
  onClose?: () => void;
}
```

**UI 表现**：

- 使用 Ant Design 的 Tag 组件
- 背景色使用 `tag.color` 的浅色版本（透明度 0.15）
- 边框色和文字色使用 `tag.color`
- 圆角：4px
- 内边距：4px 8px

**示例**：

```tsx
<TagItem tag={{ name: "React", color: "#61DAFB" }} size="default" />
```

### 4.2 TagSelect 组件

**用途**：在文章编辑页面选择标签（支持多选）

**Props**：

```typescript
interface TagSelectProps {
  value?: number[]; // 选中的标签 ID 数组
  onChange?: (value: number[]) => void;
  placeholder?: string;
  maxCount?: number; // 最多选择数量（可选）
  allowCreate?: boolean; // 是否允许快速创建（显示"+ 新建标签"）
}
```

**功能**：

- 下拉多选标签
- 显示标签名称和颜色标识
- 支持搜索过滤
- 支持一次选择多个标签
- 选中的标签以 TagItem 形式展示，可点击关闭取消选择
- （可选）支持快速创建新标签（打开创建 Modal）
- （可选）限制最多选择数量

**交互细节**：

```tsx
// 使用示例
<TagSelect
  value={[1, 3, 5]}
  onChange={handleTagChange}
  maxCount={10}
  allowCreate={true}
  placeholder="选择文章标签"
/>
```

- 下拉列表显示所有可选标签
- 已选标签在输入框内以 TagItem 展示
- 点击标签的关闭图标可移除
- 达到 maxCount 限制时，禁用未选中的标签

---

## 5. UI 细节与交互规范

### 5.1 颜色展示

- **列表页色块**：
  - 尺寸：16px × 16px
  - 圆角：2px
  - 显示在标签名称左侧
  - 后跟颜色值文本（灰色小字）

- **Tag 组件**：
- 使用 Ant Design 的 Tag 组件

### 5.2 预设颜色

- 使用 Ant Design 颜色体系
- 使用 ColorPicker 组件的预设颜色功能
- 为方便用户选择，提供以下预设颜色：

```
  "magenta",
  "red",
  "volcano",
  "orange",
  "gold",
  "lime",
  "green",
  "cyan",
  "blue",
  "geekblue",
  "purple",
```

### 5.3 加载与错误状态

- **列表加载**：使用 Ant Design Table 的 loading 属性
- **分页加载**：切换页码时显示加载状态
- **搜索加载**：搜索时显示加载状态（防抖后）
- **Modal 提交加载**：按钮显示 loading 状态，禁用取消按钮
- **错误提示**：
  - 使用 `message.error()` 显示错误信息
  - 后端返回纯文本错误，需直接展示或解析
- **成功提示**：使用 `message.success()` 显示成功信息

### 5.4 空状态

- **无标签数据**：
  - 显示 Empty 组件
  - 提示文字："暂无标签"
  - 【新建标签】按钮

- **搜索无结果**：
  - 显示 Empty 组件
  - 提示文字："未找到匹配的标签"
  - 【清空搜索】按钮

### 5.5 标签展示规范

- **文章列表页**：
  - 最多显示 3 个标签，超出显示 "+N"
  - 点击 "+N" 展开显示全部标签（Popover）

- **文章编辑页**：
  - 选中的标签显示在输入框内
  - 每行最多显示 4 个标签，自动换行
  - 支持拖拽调整标签顺序（可选功能）

---

## 6. 权限与约束

### 6.1 访问权限

- 所有标签管理功能仅限管理员访问
- 未登录用户访问 `/tags` 将重定向到登录页

### 6.2 删除约束

- 标签可以直接删除，即使有关联文章
- 删除标签后，关联文章将失去该标签（多对多关系解除）
- 删除前需明确提示用户影响范围

### 6.3 名称唯一性

- 标签名称必须唯一（不区分大小写）
- 创建/编辑时前端进行实时校验
- 后端返回 409 Conflict 时，显示"标签名称已存在"

### 6.4 数量限制

- 单篇文章最多关联 10 个标签（建议限制）
- 标签选择器通过 `maxCount` 属性控制

---

## 7. 性能优化

### 7.1 搜索防抖

- 搜索输入框使用防抖（debounce），延迟 500ms
- 避免频繁请求服务器

### 7.2 标签缓存

- 使用 React Query 或 SWR 缓存标签列表数据
- 创建/编辑/删除后自动刷新缓存
- 标签选择器可以单独调用 API 获取全部标签（无分页），或共享列表页缓存

### 7.3 分页配置持久化

- 记住用户的 pageSize 偏好（localStorage）
- 页面刷新后恢复上次的分页设置

### 7.4 虚拟滚动（可选）

- 标签选择器在标签数量超过 100 时使用虚拟滚动
- 使用 `react-window` 或 Ant Design 的 `virtual` 属性

---

## 8. 测试要点

### 8.1 功能测试

- [ ] 标签列表正常加载与服务端分页
- [ ] 分页切换功能正常（页码、每页数量）
- [ ] 服务端搜索功能正确过滤标签
- [ ] 搜索后分页状态正确重置
- [ ] 创建标签成功，列表自动更新
- [ ] 编辑标签成功，列表自动更新
- [ ] 删除标签成功，关联文章正确更新
- [ ] 名称重复时显示错误提示
- [ ] 颜色选择器正常工作
- [ ] 颜色展示正确（列表、Tag、选择器）
- [ ] 多选功能正常工作
- [ ] maxCount 限制生效

### 8.2 边界测试

- [ ] 标签名称超长处理（截断或换行）
- [ ] 颜色值异常处理（无效颜色显示默认色）
- [ ] 网络错误时的错误提示
- [ ] 空列表状态展示
- [ ] 搜索无结果状态展示
- [ ] 选择 0 个标签
- [ ] 选择最大数量标签
- [ ] 删除有大量关联文章的标签

### 8.3 交互测试

- [ ] Modal 关闭前的二次确认
- [ ] 删除标签的二次确认（含关联信息）
- [ ] 表单验证错误提示
- [ ] Loading 状态展示
- [ ] 成功/失败消息提示
- [ ] 标签选择器的展开/收起
- [ ] 已选标签的移除操作

---

## 9. 实现优先级

### P0（必须实现）

- 标签列表展示（分页）
- 服务端搜索功能
- 分页切换功能
- 创建标签
- 编辑标签
- 删除标签
- TagItem 组件
- TagSelect 组件（基础多选）

### P1（重要）

- 颜色选择器
- 表单验证
- 删除时的关联提示
- maxCount 限制
- 搜索防抖优化
- 标签数据缓存

### P2（可选）

- 分页配置持久化
- 快速创建标签入口
- 颜色预设推荐
- 文章列表标签溢出处理（"+N"）
- 标签拖拽排序
- 虚拟滚动优化

---

## 10. 与其他模块的集成

### 10.1 文章管理模块

- 文章列表页使用 `TagItem` 组件展示标签
- 文章编辑页使用 `TagSelect` 组件选择标签
- 文章筛选器支持按标签筛选（可选功能）

### 10.2 导航菜单

- 侧边栏菜单添加"标签管理"入口
- 图标：TagsOutlined 或 TagOutlined
- 路由：`/tags`

### 10.3 与分类的区别

| 特性     | 分类（Category）     | 标签（Tag）        |
| -------- | -------------------- | ------------------ |
| 关系类型 | 一对多（单选）       | 多对多（多选）     |
| 选择组件 | Select（单选）       | Select（多选）     |
| 删除限制 | 有关联文章时不可删除 | 可直接删除         |
| 文章必填 | 是                   | 否                 |
| 默认颜色 | #1890FF（蓝色）      | #52C41A（绿色）    |
| 数量限制 | 每篇文章 1 个        | 每篇文章最多 10 个 |

---

## 11. 未来扩展

- 标签分组功能（技术标签、工具标签等）
- 标签关联度分析（热门标签、相关标签）
- 标签云展示（Tag Cloud）
- 批量操作（批量删除、批量修改颜色）
- 标签统计图表（各标签文章数量分布）
- 标签导入/导出功能
- 标签别名（Alias）功能
- 自动标签推荐（基于文章内容）
