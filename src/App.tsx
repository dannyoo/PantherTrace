import React, { useEffect, useState, useRef } from 'react';

import './App.css';
import { db } from './firebase';
import QrReader from 'react-qr-scanner';

import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Box from '@material-ui/core/Box';

function App() {

  const [user, updateUser] = useState<string>();
  const [isSick, updateIsSick] = useState<any>();
  const [history, updateHistory] = useState<string[]>([]);
  const [count, updateCount] = useState<any>(false);

  const qr1 = useRef<any>(null);

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
    if (id === "") {
      window.location.href = `anonymous${Math.floor(Math.random() * 500)}`
    }
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

  function onScan(place: string) {
    if (place === null) alert("We couldn't find a QR Code.")
    else {
      let spaceTimeId: string = `${new Date().getUTCMonth()}-${new Date().getUTCDate()}-${new Date().getUTCFullYear()}-${place}`;
      let set: any = new Set([...history, spaceTimeId]);
      db.collection("Users").doc(user).update({
        history: Array.from(set)
      }).then(function () {
        console.log("Document successfully updated!");
        updateHistory(Array.from(set));
        alert("Successfully Traced Location");
      })
        .catch(function (error) {
          // The document probably doesn't exist.
          console.error("Error updating document: ", error);
        });
    }
  }

  return (
    <div className="App">
      {history && typeof count !== 'undefined' &&
        <Container maxWidth="sm" style={{ height: "100%" }} >
          <Box display="flex" p={1} flexDirection="column" justifyContent="space-around" alignItems="center" css={{ height: "100%" }}>
            <div className="bg">
              <img src="/bg.svg" alt="Illustration" />
              <Tooltip title="Open Qr Code Scanner" >
                <IconButton onClick={() => { qr1.current.openImageDialog(); }}>
                  <Icon style={{ fontSize: 200, color: "#3F51B5" }}>qr_code_scanner</Icon>
                </IconButton>
              </Tooltip>
            </div>
            <QrReader
              ref={qr1}
              legacyMode
              onError={(e: any) => { console.error(e) }}
              onScan={(data: any) => {
                onScan(data);
              }}
            />
            <div>
              {!isSick && <>
                <h3>{count === 0 ? "No Contact Detected" : `You've been nearby someone who tested positive.`}</h3>
                <p>{count === 0 ? "Based on your data, you have not been nerarby someone who tested positive for COVID-19." : `Based on your data, we found ${count} possible encounter${count > 1 ? "s" : ""}.`}</p>
              </>}
              {isSick && <>
                <h3>You have been reported as COVID positive.</h3>
                <p>People who have been nearby you are notified.</p>
              </>}

              <Tooltip title="Open New Tab">
                <Button variant="contained" style={{ margin: 14 }} color="primary" href="https://landing.google.com/screener/covid19" rel="noopener" target="_blank">Take Self Assesment</Button>
              </Tooltip>
              <Button variant="contained" onClick={() => onToggleSick(!isSick)}>{isSick ? "I don't have COVID" : "I tested COVID positive"}</Button>
            </div>
          </Box>
        </Container>
      }
    </div>
  );
}

export default App;
