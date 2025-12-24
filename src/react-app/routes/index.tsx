import { Outlet, Route, Routes } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
// import {
//   BlogPostCreate,
//   BlogPostEdit,
//   BlogPostList,
//   BlogPostShow,
// } from "./pages/blog-posts";
// import {
//   CategoryCreate,
//   CategoryEdit,
//   CategoryList,
//   CategoryShow,
// } from "./pages/categories";
import Layout from "../Layout";
import Login from "../pages/Login";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        index
        element={
          <ProtectedRoute>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* <Route path="/blog-posts">
              <Route index element={<BlogPostList />} />
              <Route path="create" element={<BlogPostCreate />} />
              <Route path="edit/:id" element={<BlogPostEdit />} />
              <Route path="show/:id" element={<BlogPostShow />} />
            </Route>
            <Route path="/categories">
              <Route index element={<CategoryList />} />
              <Route path="create" element={<CategoryCreate />} />
              <Route path="edit/:id" element={<CategoryEdit />} />
              <Route path="show/:id" element={<CategoryShow />} />
            </Route>
            <Route path="*" element={<div>error</div>} /> */}
    </Routes>
  );
};

export default AppRoutes;
