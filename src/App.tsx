import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { WebRTCView } from "./components/WebRTCView";
import { Socket } from "./components/socket";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <WebRTCView></WebRTCView>
      {/* <Socket></Socket> */}
    </div>
  );
}

export default App;
