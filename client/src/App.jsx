import "./App.css";

import AuthManager from "./AuthManager";
import Login from "./Login";
import Register from "./Register";
import AppRouter from "./AppRouter";

function App() {
  // root application component delegates auth flow to AuthManager
  return (
    <AuthManager
      Login={Login}
      Register={Register}
      Router={AppRouter}
    />
  );
}

export default App;
