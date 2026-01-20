import { lazy, Suspense } from "react";
import { Outlet, Route, Routes } from "react-router";
import { Spin } from "antd";
import ProtectedRoute from "./ProtectedRoute";

// \u4f7f\u7528 React.lazy \u8fdb\u884c\u4ee3\u7801\u5206\u5272\uff08bundle-dynamic-imports\uff09
const Layout = lazy(() => import("../Layout"));
const Login = lazy(() => import("../pages/Login"));
const Setup = lazy(() => import("../pages/Setup"));
const NotMatch = lazy(() => import("../pages/NotMatch"));
const TagList = lazy(() => import("../pages/tags"));

// \u52a0\u8f7d\u6307\u793a\u5668\u7ec4\u4ef6\uff08rendering-hoist-jsx\uff09
const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <Spin size="large" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route index element={<div>欢迎使用博客 CMS</div>} />
          <Route path="articles" element={<div>文章列表</div>} />
          <Route path="articles/new" element={<div>新建文章</div>} />
          <Route path="articles/:id/edit" element={<div>编辑文章</div>} />
          <Route path="tags" element={<TagList />} />
          <Route path="categories" element={<div>分类管理</div>} />
          <Route path="media" element={<div>媒体管理</div>} />
          <Route path="*" element={<NotMatch />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
