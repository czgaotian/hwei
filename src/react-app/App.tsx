import { App as AntdApp } from "antd";
import { BrowserRouter } from "react-router";
import Routes from "./routes";

function App() {
  return (
    <BrowserRouter>
      <AntdApp>
        <Routes />
      </AntdApp>
    </BrowserRouter>
  );
}

export default App;
