import { BrowserRouter } from "react-router";
import Routes from "./routes";
import { AuthProvider } from "./context/authContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
