import React, { useEffect, useState } from 'react';

import './App.css';
import { db } from './firebase';

import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
function App() {

  const [user, updateUser] = useState<string>();
  const [isSick, updateIsSick] = useState<any>();
  const [history, updateHistory] = useState<string[]>([]);
  const [count, updateCount] = useState<any>();

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
            } else {
              updateCount(0);
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
      console.log("Document successfully updated! Sick =", sick);
      updateIsSick(sick);
    })
      .catch(function (error) {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
  }
// eslint-disable-next-line
  function onScan(place: string) {
    let spaceTimeId: string = `${new Date().getUTCMonth()}-${new Date().getUTCDate()}-${new Date().getUTCFullYear()}-${place}`;
    let set: any = new Set([...history, spaceTimeId]);
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
      {history && typeof count !== 'undefined' &&
        <Container maxWidth="sm">
          <Tooltip title="Open Qr Code Scanner">
            <IconButton>
              <Icon style={{ fontSize: 50, color: "#3F51B5" }}>qr_code_scanner</Icon>
            </IconButton>
          </Tooltip>
          {!isSick && <>
            <h3>{count === 0 ? "No Contact Detected" : `You've been nearby someone who tested positive.`}</h3>
            <p>{count === 0 ? "Based on your data, you have not been nerarby someone who tested positive for COVID-19." : `Based on your data, we found ${count} possible encounters.`}</p>
          </>}
          {isSick && <>
            <h3>You have been reported as COVID positive.</h3>
            <p>People who have been nearby you are notified.</p>
          </>}
          <Tooltip title="Open New Tab" placement="top">
            <Button variant="contained" color="primary" href="https://landing.google.com/screener/covid19" target="_blank">Take Self Assesment</Button>
          </Tooltip>
          <Button variant="contained" onClick={() => onToggleSick(!isSick)}>{isSick ? "I don't have COVID" : "I tested COVID positive"}</Button>
        </Container>
      }
    </div>
  );
}

export default App;
