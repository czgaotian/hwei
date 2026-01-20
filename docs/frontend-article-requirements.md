# 博客文章管理 - 前端需求文档

## 1. 概述

本文档描述博客 CMS 系统中「博客文章管理（Article）」模块的前端实现需求，基于产品需求文档 3.1 章节。

### 1.1 目标用户

- 管理员（Admin）

### 1.2 核心功能

- 文章列表展示与筛选
- 创建新文章
- 编辑已有文章
- 删除文章
- 文章预览

---

## 2. 页面结构

### 2.1 文章列表页（Article List）

**路由：** `/articles`

#### 2.1.1 页面布局

- 顶部操作区
  - 【新建文章】按钮（Primary Button）
  - 筛选器区域
    - 状态筛选：全部 / 草稿 / 已发布（Select / Radio）
    - 分类筛选：全部 / 具体分类（Select，动态加载）
    - 搜索框：按标题搜索（Input.Search）
    - 【重置】按钮（清空筛选条件）
- 文章列表区（Table）
  - 列定义：
    - **标题**（title）：可点击，跳转到编辑页
    - **分类**（category）：显示分类名称及颜色标识
    - **标签**（tags）：以 Tag 组件形式展示，带颜色
    - **状态**（status）：Badge 组件显示（Draft / Published）
    - **创建时间**（createdAt）：格式化显示
    - **更新时间**（updatedAt）：格式化显示
    - **操作**（actions）：
      - 【编辑】图标按钮
      - 【删除】图标按钮（带二次确认）
- 分页器（Pagination）
  - 支持每页条数切换（10 / 20 / 50）
  - 显示总条数
  - 支持跳转到指定页

#### 2.1.2 交互行为

1. **加载文章列表**
   - 页面初始化时，调用 `GET /articles` API
   - 携带筛选参数：`status`, `categoryId`, `keyword`, `page`, `pageSize`
   - 显示 Loading 状态

2. **筛选操作**
   - 修改筛选条件时，重置页码为 1，重新请求数据
   - URL 参数同步（支持刷新页面保持筛选状态）

3. **点击标题/编辑**
   - 跳转到文章编辑页：`/articles/:id/edit`

4. **删除文章**
   - 点击删除按钮
   - 弹出二次确认 Modal："确定要删除文章「{title}」吗？此操作不可撤销。"
   - 确认后调用 `DELETE /articles/:id` API
   - 成功后：
     - 显示成功提示
     - 刷新当前页列表（若当前页无数据则跳转上一页）

5. **新建文章**
   - 点击【新建文章】按钮
   - 跳转到文章创建页：`/articles/new`

#### 2.1.3 状态管理

```typescript
interface ArticleListState {
  articles: Article[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  filters: {
    status?: "draft" | "published";
    categoryId?: number;
    keyword?: string;
  };
}
```

#### 2.1.4 API 对接

- **获取文章列表**

  ```
  GET /articles?status={status}&categoryId={categoryId}&keyword={keyword}&page={page}&pageSize={pageSize}

  Response:
  {
    data: Article[],
    pagination: {
      total: number,
      page: number,
      pageSize: number
    }
  }
  ```

- **删除文章**

  ```
  DELETE /articles/:id

  Response:
  {
    success: boolean,
    message: string
  }
  ```

---

### 2.2 文章编辑页（Article Editor）

**路由：**

- 新建：`/articles/new`
- 编辑：`/articles/:id/edit`

#### 2.2.1 页面布局

- 顶部操作栏
  - 【返回】按钮（返回列表页）
  - 页面标题：「新建文章」或「编辑文章」
  - 右侧操作按钮组：
    - 【保存草稿】按钮（Default Button）
    - 【发布】按钮（Primary Button）
    - 【预览】按钮（Default Button，可选）

- 主编辑区（两栏布局）

  **左侧：内容编辑区（占比 70%）**
  - 标题输入框（Input）
    - Placeholder: "请输入文章标题"
    - 必填，最大长度 200 字符
  - 摘要输入框（TextArea）
    - Placeholder: "请输入文章摘要（可选）"
    - 可选，最大长度 500 字符
    - 自动高度，最小 3 行
  - 正文编辑器（Tiptap）
    - 富文本工具栏：
      - 文本格式：加粗、斜体、删除线、代码
      - 标题：H1 - H6
      - 列表：无序列表、有序列表
      - 引用块
      - 代码块
      - 分割线
      - 链接插入
      - 图片插入（调用媒体库）
      - 撤销 / 重做
    - 最小高度：500px
    - 必填

  **右侧：元信息面板（占比 30%）**
  - 发布设置卡片（Card）
    - 状态选择（Radio Group）
      - 草稿（Draft）
      - 已发布（Published）
    - 创建时间（只读，编辑时显示）
    - 更新时间（只读，编辑时显示）
  - 分类设置卡片（Card）
    - 分类选择（Select）
      - 动态加载分类列表
      - 显示分类颜色标识
      - 必选
      - 【+ 新建分类】快捷入口（可选）
  - 标签设置卡片（Card）
    - 标签选择（Select Multiple）
      - 支持多选
      - 动态加载标签列表
      - 显示标签颜色
      - 可选
      - 【+ 新建标签】快捷入口（可选）

#### 2.2.2 交互行为

1. **页面初始化**
   - **新建模式**：
     - 初始化空表单
     - 默认状态为「草稿」
   - **编辑模式**：
     - 根据 `:id` 调用 `GET /articles/:id` 获取文章详情
     - 填充表单数据
     - 显示 Loading 状态

2. **分类和标签数据加载**
   - 页面初始化时：
     - 调用 `GET /categories` 获取分类列表
     - 调用 `GET /tags` 获取标签列表
   - 数据缓存到 Context 或状态管理中

3. **保存草稿**
   - 触发表单验证（仅验证必填项）
   - 验证通过后：
     - 新建：调用 `POST /articles` with `status: 'draft'`
     - 编辑：调用 `PATCH /articles/:id` with `status: 'draft'`
   - 成功后：
     - 显示「草稿保存成功」提示
     - 若是新建，跳转到编辑页面（更新 URL）
     - 更新表单的更新时间

4. **发布文章**
   - 触发完整表单验证
   - 验证通过后：
     - 新建：调用 `POST /articles` with `status: 'published'`
     - 编辑：调用 `PATCH /articles/:id` with `status: 'published'`
   - 成功后：
     - 显示「文章发布成功」提示
     - 跳转回文章列表页

5. **预览文章**（可选功能）
   - 在新窗口/抽屉中展示文章渲染效果
   - 不调用保存 API，仅前端渲染

6. **图片插入**
   - 点击工具栏的图片按钮
   - 打开媒体库 Modal（调用 Media 模块）
   - 选择图片后，插入到编辑器光标位置
   - 使用图片的可访问 URL

7. **返回操作**
   - 检查表单是否有未保存的修改
   - 若有修改，弹出确认 Modal："内容尚未保存，确定要离开吗？"
   - 确认后返回列表页

#### 2.2.3 表单验证规则

| 字段       | 验证规则         | 错误提示                                      |
| ---------- | ---------------- | --------------------------------------------- |
| title      | 必填，长度 1-200 | "请输入文章标题"<br>"标题不能超过 200 个字符" |
| summary    | 可选，长度 ≤ 500 | "摘要不能超过 500 个字符"                     |
| content    | 必填，非空 HTML  | "请输入文章内容"                              |
| categoryId | 必选             | "请选择文章分类"                              |
| tags       | 可选             | -                                             |

#### 2.2.4 状态管理

```typescript
interface ArticleEditorState {
  mode: "create" | "edit";
  loading: boolean;
  saving: boolean;
  formData: {
    title: string;
    summary?: string;
    content: string; // HTML string
    status: "draft" | "published";
    categoryId: number;
    tagIds: number[];
  };
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
  isDirty: boolean; // 表单是否有未保存修改
}

interface ReferenceData {
  categories: Category[];
  tags: Tag[];
}
```

#### 2.2.5 API 对接

- **获取文章详情**

  ```
  GET /articles/:id

  Response:
  {
    id: number,
    title: string,
    summary?: string,
    content: string,
    status: 'draft' | 'published',
    category: Category,
    tags: Tag[],
    createdAt: string,
    updatedAt: string
  }
  ```

- **创建文章**

  ```
  POST /articles
  Body:
  {
    title: string,
    summary?: string,
    content: string,
    status: 'draft' | 'published',
    categoryId: number,
    tagIds: number[]
  }

  Response:
  {
    id: number,
    // ... 完整文章数据
  }
  ```

- **更新文章**

  ```
  PATCH /articles/:id
  Body: 同创建

  Response: 同创建
  ```

- **获取分类列表**

  ```
  GET /categories

  Response:
  {
    data: Array<{
      id: number,
      name: string,
      color: string
    }>
  }
  ```

- **获取标签列表**

  ```
  GET /tags

  Response:
  {
    data: Array<{
      id: number,
      name: string,
      color: string
    }>
  }
  ```

---

## 3. 组件设计

### 3.1 ArticleList 组件

**职责：** 文章列表页面容器

**Props：** 无（从路由获取参数）

**子组件：**

- `ArticleListFilter` - 筛选器
- `ArticleTable` - 文章表格
- `DeleteConfirmModal` - 删除确认弹窗

---

### 3.2 ArticleEditor 组件

**职责：** 文章编辑器页面容器

**Props：**

```typescript
interface ArticleEditorProps {
  mode: "create" | "edit";
  articleId?: number;
}
```

**子组件：**

- `ArticleForm` - 表单容器
- `TitleInput` - 标题输入
- `SummaryInput` - 摘要输入
- `RichTextEditor` - Tiptap 富文本编辑器
- `ArticleMetaPanel` - 右侧元信息面板
  - `StatusSelector` - 状态选择
  - `CategorySelector` - 分类选择
  - `TagSelector` - 标签选择

---

### 3.3 RichTextEditor 组件

**职责：** 封装 Tiptap 编辑器

**Props：**

```typescript
interface RichTextEditorProps {
  value: string; // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  onImageInsert?: () => void; // 触发媒体库选择
}
```

**功能：**

- 配置 Tiptap 编辑器实例
- 提供工具栏 UI
- 处理内容变化
- 集成媒体库选择器

---

## 4. Tiptap 编辑器配置

### 4.1 所需扩展（Extensions）

```typescript
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Image.configure({
      inline: true,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
    Placeholder.configure({
      placeholder: "开始写作...",
    }),
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },
});
```

### 4.2 工具栏配置

```typescript
const toolbar = [
  { type: "heading", levels: [1, 2, 3] },
  { type: "bold" },
  { type: "italic" },
  { type: "strike" },
  { type: "code" },
  { type: "separator" },
  { type: "bulletList" },
  { type: "orderedList" },
  { type: "separator" },
  { type: "blockquote" },
  { type: "codeBlock" },
  { type: "separator" },
  { type: "link" },
  { type: "image" },
  { type: "separator" },
  { type: "horizontalRule" },
  { type: "separator" },
  { type: "undo" },
  { type: "redo" },
];
```

### 4.3 图片插入流程

1. 用户点击工具栏的「图片」按钮
2. 触发 `onImageInsert` 回调
3. 打开媒体库选择 Modal（Media 模块提供）
4. 用户选择图片后，获取图片 URL
5. 调用 `editor.chain().focus().setImage({ src: url }).run()`

---

## 5. 样式与 UI 规范

### 5.1 组件库

- 使用 Ant Design 5.x
- 遵循 Ant Design 设计规范

### 5.2 布局

- 编辑器采用两栏布局（70% / 30%）
- 列表页采用单栏布局，内容最大宽度 1400px

### 5.3 颜色标识

- 分类/标签颜色：使用 Ant Design Tag 组件的 `color` 属性
- 状态 Badge：
  - Draft：灰色（default）
  - Published：绿色（success）

### 5.4 响应式设计

- 编辑器在窄屏（< 768px）下改为单栏布局
- 表格在移动端使用 `scroll={{ x: 'max-content' }}`

---

## 6. 错误处理

### 6.1 API 错误

- 捕获所有 API 请求错误
- 显示友好的错误提示（message.error）
- 根据 HTTP 状态码区分错误类型：
  - 400：参数错误，显示具体字段错误
  - 401：未授权，跳转登录页
  - 403：无权限，显示权限不足提示
  - 404：资源不存在
  - 500：服务器错误，显示通用错误提示

### 6.2 网络错误

- 请求超时（30s）
- 断网情况，显示「网络连接失败」

### 6.3 表单验证错误

- 实时验证（blur / change）
- 提交时完整验证
- 错误信息显示在表单项下方

---

## 7. 性能优化

### 7.1 列表页

- 使用虚拟滚动（大数据量时）
- 分页加载，避免一次性加载全部数据

### 7.2 编辑器

- Tiptap 编辑器内容防抖保存（可选）
- 图片懒加载

### 7.3 数据缓存

- 分类和标签数据缓存（React Query / SWR）
- 避免重复请求

---

## 8. 用户体验优化

### 8.1 Loading 状态

- 列表加载时显示 Skeleton
- 保存操作时按钮显示 Loading 状态

### 8.2 反馈提示

- 所有操作成功/失败都有明确提示
- 提示自动消失时间：2-3 秒

### 8.3 键盘快捷键（可选）

- `Cmd/Ctrl + S`：保存草稿
- `Cmd/Ctrl + Enter`：发布文章

### 8.4 自动保存（可选）

- 每 30 秒自动保存草稿
- 在右上角显示「已自动保存」提示

---

## 9. 数据类型定义

```typescript
// Article 相关类型
interface Article {
  id: number;
  title: string;
  summary?: string;
  content: string; // HTML
  status: ArticleStatus;
  category: Category;
  tags: Tag[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

type ArticleStatus = "draft" | "published";

interface Category {
  id: number;
  name: string;
  color: string; // Hex color
}

interface Tag {
  id: number;
  name: string;
  color: string; // Hex color
}

// API 请求类型
interface CreateArticleRequest {
  title: string;
  summary?: string;
  content: string;
  status: ArticleStatus;
  categoryId: number;
  tagIds: number[];
}

interface UpdateArticleRequest extends CreateArticleRequest {}

interface GetArticlesRequest {
  status?: ArticleStatus;
  categoryId?: number;
  keyword?: string;
  page: number;
  pageSize: number;
}

interface GetArticlesResponse {
  data: Article[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
```

---

## 10. 测试要点

### 10.1 功能测试

- [ ] 列表页能正确展示文章列表
- [ ] 筛选功能工作正常
- [ ] 分页功能正常
- [ ] 创建文章成功
- [ ] 编辑文章能保存修改
- [ ] 删除文章后列表更新
- [ ] 状态切换正常（草稿 ↔ 发布）
- [ ] 富文本编辑器所有功能可用
- [ ] 图片插入功能正常

### 10.2 边界测试

- [ ] 标题超长处理
- [ ] 内容为空时的提示
- [ ] 删除最后一页的最后一条记录
- [ ] 网络错误处理
- [ ] 表单验证覆盖所有规则

### 10.3 用户体验测试

- [ ] Loading 状态显示及时
- [ ] 错误提示清晰易懂
- [ ] 未保存提示正常工作
- [ ] 操作响应流畅

---

## 11. 依赖项

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "antd": "^5.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-image": "^2.x",
    "@tiptap/extension-link": "^2.x",
    "@tiptap/extension-placeholder": "^2.x",
    "axios": "^1.x",
    "dayjs": "^1.x"
  }
}
```

---

## 12. 后续扩展

- 文章版本历史
- 定时发布
- SEO 设置（meta description, keywords）
- 文章协作编辑
- Markdown 模式切换
