import { PropsWithChildren } from "react";
import "./styles/theme.less";

function App({ children }: PropsWithChildren<any>) {
  return children;
}

export default App;
