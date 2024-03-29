import { useEffect, useState } from "react";
import "./App.css";
import "./reset.css";
import chroma from "chroma-js";
import ntc from "ntcjs";
import { baseURL } from "./constants";

const apiURL = `${baseURL}/api`;

function App() {
  const buttonLifeSpan = 1000 * 60 * 60 * 24 * 7 * 2; // Two Weeks

  const [mostRecentClick, setMostRecentClick] = useState(new Date());
  const [users, setUsers] = useState(null);
  const [totalClicks, setTotalClicks] = useState(null);

  const [username, setUsername] = useState("");

  const [inputUserID, setInputUserID] = useState("");

  const [newUser, setNewUser] = useState(true);

  const [isReturningUser, setIsReturningUser] = useState(false);

  function getUserID() {
    let userID = window.localStorage.getItem("userID");
    if (!userID) {
      userID = crypto.randomUUID();
      window.localStorage.setItem("userID", userID);
    }
    return userID;
  }

  function swapInputType() {
    setIsReturningUser(!isReturningUser);
  }

  const [userID, setUserID] = useState(getUserID());

  function changeToUserID() {
    const foundUser = users.find((user) => user.userID === inputUserID);
    if (foundUser) {
      localStorage.setItem("userID", inputUserID);
      setUserID(inputUserID);
      setNewUser(false);
    } else alert("Not found.");
  }

  function invalidUserID() {
    return !users.find((user) => user.userID === inputUserID);
  }

  function getScoreboardUsers() {
    const sorted = users.sort((a, b) => b.score - a.score);
    return sorted.slice(0, 10);
  }

  useEffect(() => {
    (async function fetchData() {
      const response = await fetch(`${apiURL}/data`);
      const data = await response.json();
      setMostRecentClick(new Date(data.mostRecentClick));
      setTotalClicks(data.totalClicks);
      setUsers(data.users);
      if (data.users) {
        const user = data.users.find((user) => user.userID === userID);
        if (user) {
          setUsername(user.name);
          setNewUser(false);
        }
      }
    })();
  }, [userID]);

  function getButtonLifePercent() {
    const now = new Date();
    const buttonAge = now - mostRecentClick;
    if (buttonAge > buttonLifeSpan) return 1;
    return buttonAge / buttonLifeSpan;
  }

  function getColorProgress(unitInterval) {
    if (unitInterval > 1 || unitInterval < 0) return;

    const firstThreshold = 0.7;
    const secondThreshold = 0.8;

    if (unitInterval < firstThreshold) {
      const scaledPercent = unitInterval / firstThreshold;
      return {
        hue: scaledPercent * 320,
        saturation: 1,
        lightness: 0.5,
      };
    }
    if (unitInterval < secondThreshold) {
      const scaledPercent =
        (unitInterval - firstThreshold) / (secondThreshold - firstThreshold);
      return {
        hue: 320,
        saturation: 1,
        lightness: 0.5 + scaledPercent * 0.5,
      };
    }
    const scaledPercent =
      (unitInterval - secondThreshold) / (1 - secondThreshold);
    return {
      hue: 320,
      saturation: 0,
      lightness: 1 - scaledPercent,
    };
  }

  function isButtonDisabled() {
    if (users === null || totalClicks === null) return true;
    if (!username && newUser) return true;
    const user = users.find((user) => user.userID === userID);
    return user && user.score > getButtonLifePercent();
  }

  function toHslString({ hue, saturation, lightness }) {
    return `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`;
  }

  function scoreToName(score) {
    const { hue, saturation, lightness } = getColorProgress(score);
    const chromaColor = chroma.hsl(hue, saturation, lightness);
    const hex = chromaColor.hex();
    const name = ntc.name(hex)[1];
    return name;
  }

  async function sendClick() {
    if (!username) return;
    const bodyData = {
      userID: userID,
      score: getButtonLifePercent(),
      name: username,
    };
    const response = await fetch(`${apiURL}/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await response.json();
    setMostRecentClick(new Date(data.mostRecentClick));
    setTotalClicks(data.totalClicks);
    setUsers(data.users);
    setNewUser(false);
  }

  return (
    <div className="App">
      <div className="content">
        <h1>The Button</h1>
        <div className="color-circle-wrapper">
          <button
            disabled={isButtonDisabled()}
            onClick={sendClick}
            className="color-circle"
            style={{
              backgroundColor: toHslString(
                getColorProgress(getButtonLifePercent())
              ),
            }}
          ></button>
        </div>
        <div className="input-wrapper">
          {newUser ? (
            <>
              {isReturningUser ? (
                <input
                  value={inputUserID}
                  onChange={(e) => setInputUserID(e.target.value)}
                  placeholder="What's your user ID?"
                ></input>
              ) : (
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="What's your name?"
                ></input>
              )}
              {inputUserID ? (
                <button
                  className="input-swapper"
                  onClick={changeToUserID}
                  disabled={invalidUserID()}
                >
                  ✓
                </button>
              ) : (
                <button className="input-swapper" onClick={swapInputType}>
                  ⇆
                </button>
              )}
            </>
          ) : (
            <div className="button-message">
              welcome back, {username.toLowerCase()}
            </div>
          )}
        </div>
      </div>
      {users && (
        <div className="scoreboard">
          <h2>Scoreboard</h2>
          <div className="user-list">
            {getScoreboardUsers().map((user, index) => (
              <>
                <div className="user-id">
                  {index + 1}. {user.name}
                </div>
                <div
                  className="score-circle"
                  style={{
                    backgroundColor: toHslString(getColorProgress(user.score)),
                  }}
                >
                  <div className="tooltip-text">{scoreToName(user.score)}</div>
                </div>
              </>
            ))}
          </div>
          <div className="click-counter">Total Clicks: {totalClicks}</div>
        </div>
      )}
      <div className="app-version">v1.2</div>
    </div>
  );
}

export default App;
