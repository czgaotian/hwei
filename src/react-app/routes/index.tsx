import { Outlet, Route, Routes } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../Layout";
import Login from "../pages/Login";
import Setup from "../pages/Setup";
import NotMatch from "../pages/NotMatch";

const AppRoutes = () => {
  return (
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
        <Route path="tags" element={<>标签管理</>} />
        <Route path="categories" element={<div>分类管理</div>} />
        <Route path="media" element={<div>媒体管理</div>} />
        <Route path="*" element={<NotMatch />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
