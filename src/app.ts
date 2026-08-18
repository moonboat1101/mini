import { PropsWithChildren } from "react";
import { initCardExchangeCloud } from "./services/cardExchangeCloud";
import "./styles/theme.less";

initCardExchangeCloud();

function App({ children }: PropsWithChildren<any>) {
  return children;
}

export default App;
