import { Outlet, Route, Routes } from "react-router";
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        element={
          <Layout>
            <Outlet />
          </Layout>
        }
      >
        <Route path="/" element={<div>home</div>} />
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
      </Route>
    </Routes>
  );
};

export default AppRoutes;
