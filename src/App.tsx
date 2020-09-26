import React, { useEffect, useState } from 'react';

import './App.css';
import { db } from './firebase';

function App() {

  const [user, updateUser] = useState<string>();
  const [isSick, updateIsSick] = useState<boolean>();
  const [history, updateHistory] = useState<string[]>([]);
  const [count, updateCount] = useState<number>();

  useEffect(() => {

    function listen(id: string, myHistory: string[]) {
      if (myHistory.length > 0) {
        // Listen to Data to see if you have come in contact with someone sick
        db.collection("Users")
          .where("sick", "==", true)
          .where("history", "array-contains-any", myHistory)
          .onSnapshot(function (querySnapshot) {
            let count: number = 0;
            querySnapshot.forEach(function (doc: any) {
              count++;
            });
            updateCount(count);
          });
      } else if (myHistory.length === 0) {
        // make sure the user has a history
        let unsubscribe = db.collection("Users").doc(id)
          .onSnapshot(function (querySnapshot) {
            if (querySnapshot?.data()?.history.length > 0) {
              updateHistory(querySnapshot?.data()?.history);
              unsubscribe(); //may cause error
              listen(id, querySnapshot?.data()?.history);
            }
          });
      }
    }

    let url: string[] = window.location.pathname.split("/");
    let id: string = url[1];
    updateUser(id);

    let me = db.collection("Users").doc(id);

    // Make sure user exists.
    me.get().then((docSnapshot) => {
      if (docSnapshot.exists) {
        let sicky: boolean = docSnapshot?.data()?.sick;
        let hissy: string[] = docSnapshot?.data()?.history;
        updateIsSick(sicky);
        updateHistory(hissy);
        listen(id, hissy);
      } else {
        me.set({
          sick: false,
          history: []
        })
          .then(function () {
            console.log("Document successfully written!");
            updateIsSick(false);
            updateHistory([]);
            listen(id, []);
          })
          .catch(function (error) {
            console.error("Error writing document: ", error);
          });
      }
    });

  }, []);


  function onToggleSick(sick: boolean) {
    db.collection("Users").doc(user).update({
      sick: sick
    }).then(function () {
      console.log("Document successfully updated!");
      updateIsSick(sick);
    })
      .catch(function (error) {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
  }

  function onScan(place: string) {
    let spaceTimeId:string = `${new Date().getUTCMonth()}-${new Date().getUTCDate()}-${new Date().getUTCFullYear()}-${place}`;
    let set: any = new Set([...history,spaceTimeId]);
    db.collection("Users").doc(user).update({
      history: Array.from(set)
    }).then(function () {
      console.log("Document successfully updated!");
      updateHistory(Array.from(set));
    })
      .catch(function (error) {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
