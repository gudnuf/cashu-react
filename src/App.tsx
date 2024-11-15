import reactLogo from "./assets/react.svg";
import "./App.css";
import HooksDemo from "./components/HooksDemo";

function App() {
  return (
    <div className="App">
      <img height={200} src={reactLogo} />
      <h2>Cashu React</h2>
      <HooksDemo />
    </div>
  );
}

export default App;
