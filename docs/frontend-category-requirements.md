# 分类管理 - 前端需求文档

## 1. 概述

本文档描述博客 CMS 系统中「分类管理（Category）」模块的前端实现需求，基于产品需求文档 3.2 章节。

### 1.1 目标用户

- 管理员（Admin）

### 1.2 核心功能

- 分类列表展示
- 创建新分类
- 编辑分类信息
- 删除分类
- 分类颜色管理

---

## 2. 页面结构

### 2.1 分类列表页（Category List）

**路由：** `/categories`

#### 2.1.1 页面布局

- 顶部操作区
  - 【新建分类】按钮（Primary Button）
  - 搜索框：按分类名称搜索（Input.Search）
- 分类列表区（Table）
  - 列定义：
    - **分类名称**（name）：显示名称及颜色标识（色块 + 文字）
    - **颜色**（color）：以色块形式展示，显示颜色值（如 #FF5733）
    - **文章数量**（articleCount）：显示该分类下的文章数量
    - **创建时间**（createdAt）：格式化显示
    - **更新时间**（updatedAt）：格式化显示
    - **操作**（actions）：
      - 【编辑】图标按钮
      - 【删除】图标按钮（带二次确认，若有关联文章则禁用）
- 分页器（Pagination）
  - 支持每页条数切换（10 / 20 / 50）
  - 显示总条数
  - 支持跳转到指定页

#### 2.1.2 交互行为

1. **加载分类列表**
   - 页面初始化时，调用 `GET /categories` API
   - 携带参数：`keyword`, `page`, `pageSize`
   - 显示 Loading 状态

2. **搜索操作**
   - 修改搜索关键词时，重置页码为 1，重新请求数据
   - 支持实时搜索或按回车触发（建议使用防抖优化）

3. **新建分类**
   - 点击【新建分类】按钮
   - 打开新建分类 Modal

4. **编辑分类**
   - 点击【编辑】按钮
   - 打开编辑分类 Modal，填充当前分类数据

5. **删除分类**
   - 点击删除按钮
   - 检查是否有关联文章：
     - **无关联文章**：
       - 弹出二次确认 Modal："确定要删除分类「{name}」吗？此操作不可撤销。"
       - 确认后调用 `DELETE /categories/:id` API
       - 成功后显示成功提示，刷新当前页列表
     - **有关联文章**：
       - 按钮禁用状态，鼠标悬停提示："该分类下有 {count} 篇文章，无法删除"
       - 或弹出提示："该分类下有 {count} 篇文章，请先移除文章关联后再删除"

#### 2.1.3 状态管理

```typescript
interface CategoryListState {
  categories: Category[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  filters: {
    keyword?: string;
  };
  modalVisible: boolean;
  editingCategory: Category | null;
}
```

#### 2.1.4 API 对接

- **获取分类列表**

  ```
  GET /categories?keyword={keyword}&page={page}&pageSize={pageSize}

  Response:
  {
    data: Category[],
    pagination: {
      total: number,
      page: number,
      pageSize: number
    }
  }
  ```

- **删除分类**

  ```
  DELETE /categories/:id

  Response (成功):
  {
    success: true,
    message: "分类删除成功"
  }

  Response (失败 - 有关联文章):
  {
    success: false,
    error: "该分类下有文章，无法删除",
    articleCount: 5
  }
  ```

---

### 2.2 分类创建/编辑 Modal

#### 2.2.1 Modal 设置

- **标题**：
  - 创建模式："新建分类"
  - 编辑模式："编辑分类"
- **宽度**：480px
- **底部按钮**：
  - 【取消】按钮（Default Button）
  - 【确定】按钮（Primary Button）

#### 2.2.2 表单字段

| 字段名 | 组件类型    | 规则                               | 说明                     |
| ------ | ----------- | ---------------------------------- | ------------------------ |
| name   | Input       | 必填，最大长度 50 字符，不允许重复 | 分类名称                 |
| color  | ColorPicker | 必填，默认值 #1890FF               | 分类颜色（用于前端展示） |

**表单布局**：

```
┌─────────────────────────────────────┐
│  分类名称 *                         │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  分类颜色 *                         │
│  ┌──┐ #1890FF                       │
│  │██│ [颜色选择器]                  │
│  └──┘                               │
└─────────────────────────────────────┘
```

#### 2.2.3 交互行为

1. **打开 Modal**
   - **创建模式**：
     - 表单为空
     - 颜色默认为 `#1890FF`
   - **编辑模式**：
     - 表单填充当前分类数据
     - 禁用名称字段或允许修改（根据业务需求）

2. **颜色选择**
   - 使用 Ant Design 的 ColorPicker 组件
   - 支持预设颜色选择（推荐常用颜色）
   - 支持自定义十六进制颜色输入
   - 实时预览颜色效果

3. **表单验证**
   - 名称必填，不能为空
   - 名称不能超过 50 字符
   - 名称不能与已有分类重复（前端验证 + 后端验证）
   - 颜色必须是有效的十六进制颜色值

4. **提交表单**
   - 点击【确定】按钮
   - 进行前端验证
   - 验证通过后：
     - **创建模式**：调用 `POST /categories` API
     - **编辑模式**：调用 `PUT /categories/:id` API
   - 成功后：
     - 关闭 Modal
     - 显示成功提示："分类创建/更新成功"
     - 刷新分类列表
   - 失败则显示错误信息（如名称重复）

5. **取消操作**
   - 点击【取消】按钮或点击遮罩层关闭 Modal
   - 如表单有修改，弹出二次确认："确定要放弃当前编辑吗？"
   - 确认后关闭 Modal，放弃修改

#### 2.2.4 API 对接

- **创建分类**

  ```
  POST /categories

  Request:
  {
    "name": "技术分享",
    "color": "#FF5733"
  }

  Response (成功):
  {
    "data": {
      "id": 1,
      "name": "技术分享",
      "color": "#FF5733",
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-20T10:00:00Z"
    }
  }

  Response (失败 - 名称重复):
  {
    "error": "分类名称已存在"
  }
  ```

- **编辑分类**

  ```
  PUT /categories/:id

  Request:
  {
    "name": "技术分享",
    "color": "#FF5733"
  }

  Response (成功):
  {
    "data": {
      "id": 1,
      "name": "技术分享",
      "color": "#FF5733",
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-20T10:30:00Z"
    }
  }

  Response (失败):
  {
    "error": "分类名称已存在"
  }
  ```

---

## 3. 数据类型定义

### 3.1 Category 类型

```typescript
interface Category {
  id: number;
  name: string;
  color: string; // 十六进制颜色值，如 "#1890FF"
  articleCount?: number; // 关联的文章数量（列表接口返回）
  createdAt: string; // ISO 8601 格式
  updatedAt: string; // ISO 8601 格式
}
```

### 3.2 API Response 类型

```typescript
// 列表响应
interface CategoryListResponse {
  data: Category[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 单个分类响应
interface CategoryResponse {
  data: Category;
}

// 错误响应
interface ErrorResponse {
  error: string;
  articleCount?: number; // 删除失败时返回关联文章数量
}
```

---

## 4. 组件复用

### 4.1 CategoryTag 组件

**用途**：在文章列表、编辑页面等地方展示分类标签

**Props**：

```typescript
interface CategoryTagProps {
  category: {
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
- 背景色使用 `category.color` 的浅色版本（透明度 0.1）
- 边框色和文字色使用 `category.color`
- 前置色块：一个小的实心色块，使用 `category.color`

**示例**：

```tsx
<CategoryTag category={{ name: "技术分享", color: "#FF5733" }} size="default" />
```

### 4.2 CategorySelect 组件

**用途**：在文章编辑页面选择分类

**Props**：

```typescript
interface CategorySelectProps {
  value?: number; // 选中的分类 ID
  onChange?: (value: number) => void;
  placeholder?: string;
  allowCreate?: boolean; // 是否允许快速创建（显示"+ 新建分类"）
}
```

**功能**：

- 下拉选择分类
- 显示分类名称和颜色标识
- 支持搜索过滤
- （可选）支持快速创建新分类（打开创建 Modal）

---

## 5. UI 细节与交互规范

### 5.1 颜色展示

- **列表页色块**：
  - 尺寸：16px × 16px
  - 圆角：2px
  - 显示在分类名称左侧
  - 后跟颜色值文本（灰色小字）

- **Tag 组件**：
  - 背景色：`category.color` 透明度 0.1
  - 边框：1px solid `category.color`
  - 文字色：`category.color`
  - 前置实心色块：8px × 8px，`category.color`

### 5.2 预设颜色

为方便用户选择，提供以下预设颜色：

```typescript
const PRESET_COLORS = [
  "#1890FF", // 蓝色
  "#52C41A", // 绿色
  "#FA8C16", // 橙色
  "#F5222D", // 红色
  "#722ED1", // 紫色
  "#13C2C2", // 青色
  "#EB2F96", // 洋红
  "#FAAD14", // 黄色
];
```

### 5.3 加载与错误状态

- **列表加载**：使用 Ant Design Table 的 loading 属性
- **Modal 提交加载**：按钮显示 loading 状态，禁用取消按钮
- **错误提示**：使用 `message.error()` 显示错误信息
- **成功提示**：使用 `message.success()` 显示成功信息

### 5.4 空状态

- **无分类数据**：
  - 显示 Empty 组件
  - 提示文字："暂无分类"
  - 【新建分类】按钮

- **搜索无结果**：
  - 显示 Empty 组件
  - 提示文字："未找到匹配的分类"
  - 【清空搜索】按钮

---

## 6. 权限与约束

### 6.1 访问权限

- 所有分类管理功能仅限管理员访问
- 未登录用户访问 `/categories` 将重定向到登录页

### 6.2 删除约束

- 分类下有关联文章时，不允许删除
- 前端通过 `articleCount` 字段判断是否可删除
- 后端返回 403 或 400 错误时，前端显示相应提示

### 6.3 名称唯一性

- 分类名称必须唯一（不区分大小写）
- 创建/编辑时前端进行实时校验
- 后端返回 409 Conflict 时，显示"分类名称已存在"

---

## 7. 性能优化

### 7.1 搜索防抖

- 搜索输入框使用防抖（debounce），延迟 300ms

### 7.2 分类缓存

- 使用 React Query 或 SWR 缓存分类列表
- 创建/编辑/删除后自动刷新缓存

### 7.3 分页优化

- 默认每页 20 条
- 记住用户的 pageSize 偏好（localStorage）

---

## 8. 测试要点

### 8.1 功能测试

- [ ] 分类列表正常加载与分页
- [ ] 搜索功能正确过滤分类
- [ ] 创建分类成功，列表自动更新
- [ ] 编辑分类成功，列表自动更新
- [ ] 删除无关联文章的分类成功
- [ ] 删除有关联文章的分类被阻止
- [ ] 名称重复时显示错误提示
- [ ] 颜色选择器正常工作
- [ ] 颜色展示正确（列表、Tag、选择器）

### 8.2 边界测试

- [ ] 分类名称超长处理（截断或换行）
- [ ] 颜色值异常处理（无效颜色显示默认色）
- [ ] 网络错误时的错误提示
- [ ] 空列表状态展示
- [ ] 搜索无结果状态展示

### 8.3 交互测试

- [ ] Modal 关闭前的二次确认
- [ ] 删除分类的二次确认
- [ ] 表单验证错误提示
- [ ] Loading 状态展示
- [ ] 成功/失败消息提示

---

## 9. 实现优先级

### P0（必须实现）

- 分类列表展示
- 创建分类
- 编辑分类
- 删除分类（带关联检查）
- 基本搜索功能

### P1（重要）

- 颜色选择器
- CategoryTag 组件
- CategorySelect 组件
- 表单验证

### P2（可选）

- 搜索防抖优化
- 分类数据缓存
- 快速创建分类入口
- 颜色预设推荐

---

## 10. 与其他模块的集成

### 10.1 文章管理模块

- 文章列表页使用 `CategoryTag` 组件展示分类
- 文章编辑页使用 `CategorySelect` 组件选择分类
- 文章筛选器调用分类列表 API

### 10.2 导航菜单

- 侧边栏菜单添加"分类管理"入口
- 图标：FolderOutlined 或 AppstoreOutlined
- 路由：`/categories`

---

## 11. 未来扩展

- 分类排序功能（拖拽排序）
- 分类层级结构（父子分类）
- 批量操作（批量删除、批量修改颜色）
- 分类统计图表（各分类文章数量分布）
- 分类导入/导出功能
