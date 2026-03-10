import { PropsWithChildren } from "react";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/index.scss";
import "./styles/theme.less";

function App({ children }: PropsWithChildren<any>) {
  return children;
}

export default App;
