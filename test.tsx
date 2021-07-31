import * as React from "react";

type Props = {
  color: string;
};

const App: React.FC<Props> = ({ color }) => {
  return <h1 style={{ color }}>hello</h1>;
};

export default App;
