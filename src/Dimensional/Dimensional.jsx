import React, { useEffect, useState, useRef} from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/database';
import './Dimensional.css';
import backIcon from '../Assets/back.png';
import playIcon from '../Assets/play.png';
import nextIcon from '../Assets/next.png';
import 'firebase/compat/firestore';
import * as XLSX from 'xlsx';

//firebase configration
const firebaseConfig = {
  apiKey: "AIzaSyDXDFzYiSEJAipk-XE2BrCON9HXCyElvEg",
  authDomain: "angry1-c105e.firebaseapp.com",
  projectId: "angry1-c105e",
  storageBucket: "angry1-c105e.appspot.com",
  messagingSenderId: "183015084922",
  appId: "1:183015084922:web:5c8f5b848bde58d0037cc3",
  measurementId: "G-C835L58SP4"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const storage = firebase.storage();
  const audioFilesRef = storage.ref('angry');
  const firestore = firebase.firestore();
  const annotationCollection = firestore.collection('annotation');
  const Dimensional = () => {
    const transcriptionRef = useRef(null);
    const valenceRef = useRef(null);
    const arousalRef = useRef(null);
    const dominanceRef = useRef(null);
    const saveButtonRef = useRef(null);
    
    const [audioUrls, setAudioUrls] = useState([]);
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
    const [fileName, setFileName] = useState('');
    const [audioFiles, setAudioFiles] = useState([]);
    const [annotations, setAnnotations] = useState([]);
    const [warningMessage, setWarningMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [unannotatedFiles, setUnannotatedFiles] = useState([]);
    const [showUnannotatedTable, setShowUnannotatedTable] = useState(false);


//automatically update the table from storage 
    useEffect(() => {
      const unsubscribe = firebase.firestore().collection('annotation')
        .orderBy('filename', 'desc')
        .onSnapshot((snapshot) => {
          const updatedAnnotations = snapshot.docs.map((doc) => doc.data());
          setAnnotations(updatedAnnotations);
        });
  
      return () => unsubscribe();
    }, []);


    //export to excel fieles 

    const exportToExcel = async () => {
      setSuccessMessage("Exporting....... please wait");
      setWarningMessage("");
      const collectionRef = firebase.firestore().collection('annotation');
      const snapshot = await collectionRef.get();
      const data = [];
    
      snapshot.forEach((doc) => {
        const { filename, transcription, valence, arousal, dominance } = doc.data();
        data.push([filename, transcription, valence, arousal, dominance]);
      });
    
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['Filename', 'Transcription', 'Valence', 'Arousal', 'Dominance'],
        ...data,
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Annotations');
      XLSX.writeFile(workbook, 'annotations.xlsx');
    };

    
    //fetch data for updating instance
    let currentSpeech = 0;
    async function fetchData() {
      try {
        // const querySnapshot = await firestore
        //   .collection("instance")
        //   .where(firebase.firestore.FieldPath.documentId(), "==", "instance")
        //   .where("key", "==", 21)
        //   .get();
    
        // if (!querySnapshot.empty) {
        //   const totalDocuments = querySnapshot.size;
        //   console.log("Total number of documents:", totalDocuments);
        //   const documentSnapshot = querySnapshot.docs[0];
        //   const data = documentSnapshot.data();
        //   instance = data.instance
        //   console.log(instance);
        // } else {
        //   setWarningMessage('No matching documents found.');
        //   setSuccessMessage('');
        // }

const annotationCollectionRef = firebase.firestore().collection("annotation");
annotationCollectionRef.get()
  .then((querySnapshot) => {
    const totalDocuments = querySnapshot.size;
    currentSpeech =totalDocuments;
    console.log("Total number of documents in 'annotation' collection:", currentSpeech);
  })
      } catch (error) {
        setWarningMessage("Error fetching data:", error);
          setSuccessMessage('');
      }
    }
    
    fetchData();
 
    useEffect(() => {
      // Automatically remove the warning message after 3 seconds
      if (warningMessage !== '') {
        const warningTimeout = setTimeout(() => {
          setWarningMessage('');
        }, 3000);
  
        return () => clearTimeout(warningTimeout);
      }
  
      // Automatically remove the success message after 3 seconds
      if (successMessage !== '') {
        const successTimeout = setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
  
        return () => clearTimeout(successTimeout);
      }
    }, [warningMessage, successMessage]);


    useEffect(() => {
      // Fetch annotations from Firestore
      annotationCollection
        .get()
        .then((querySnapshot) => {
          const fetchedAnnotations = [];
          querySnapshot.forEach((doc) => {
            fetchedAnnotations.push(doc.data());
          });
          setAnnotations(fetchedAnnotations);
        })
        .catch((error) => {
          setWarningMessage('Error fetching annotations from Firestore:', error);
          setSuccessMessage('');
        });
    }, []);
    
  
    useEffect(() => {     

      const fetchAudioUrls = async () => {
        try {
          const response = await audioFilesRef.listAll();
          const files = response.items;
          setAudioFiles(files);
  
          const urls = await Promise.all(
            files.map(async (fileRef) => {
              const url = await fileRef.getDownloadURL();
              return url;
            })
          );
  
          setAudioUrls(urls);
  
          if (files.length > 0) {
            const firstFileName = files[currentSpeech].name;
            setCurrentAudioIndex(currentSpeech);
            setFileName(firstFileName);
          }
        } catch (error) {
          console.log(error);
        }
      };
  
      fetchAudioUrls();
    }, []);



    useEffect(() => {
        const handleKeyDown = (event) => {
          switch (event.key) {
            case 'ArrowRight':
              handleNextField();
              break;
            case 'ArrowLeft':
              handlePreviousField();
              break;
              case 'Enter':
             handleEnterKey(event);
             break;
            default:
              break;
          }
        };
    
        document.addEventListener('keydown', handleKeyDown);
    
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      }, []);

    
      const handleNextField = () => {

         if (document.activeElement === saveButtonRef.current) {
          valenceRef.current.focus();
        } else if (document.activeElement === valenceRef.current) {
          arousalRef.current.focus();
        } else if (document.activeElement === arousalRef.current) {
          dominanceRef.current.focus();
        }
        else if (document.activeElement === dominanceRef.current) {
            saveButtonRef.current.focus();
          }
          else if (document.activeElement === saveButtonRef.current) {
            valenceRef.current.focus();
          }
      };
    
      const handlePreviousField = () => {
        if (document.activeElement === valenceRef.current) {
          saveButtonRef.current.focus();
        } else if (document.activeElement === saveButtonRef.current) {
          dominanceRef.current.focus();
        } else if (document.activeElement === dominanceRef.current) {
          arousalRef.current.focus();
        }
        else if (document.activeElement === arousalRef.current) {
            valenceRef.current.focus();
          }
          else if (document.activeElement === valenceRef.current) {
            saveButtonRef.current.focus();
          }
      };


    const handlePlayAudio = () => {
      const audioElement = new Audio(audioUrls[currentAudioIndex]);
      audioElement.play();
    };
  
    const handleBackAudio = () => {
      if (currentAudioIndex > 0) {
        const prevIndex = currentAudioIndex - 1;
        const prevFileName = audioFiles[prevIndex].name;
        setCurrentAudioIndex(prevIndex);
        setFileName(prevFileName);
      }
      else{
      setWarningMessage('please go forward! it is the first record');
      setSuccessMessage('');
      }
    };
  
    const handleNextAudio = () => {
      if (currentAudioIndex < audioUrls.length - 1) {
        const nextIndex = currentAudioIndex+1;
        const nextFileName = audioFiles[nextIndex].name;
        setCurrentAudioIndex(nextIndex);
        setFileName(nextFileName);
      }
      else{
      setWarningMessage('please go back! it is the last record');
      setSuccessMessage('');
      }
    };

    const handleEnterKey = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault(); 
          handleSave();
        }
     };
     
  
     //check for missing files
     const checkForMissingFiles=()=>{
     //set first the missing file table invisible
      setShowUnannotatedTable(!showUnannotatedTable);
      const storageRef = firebase.storage().ref().child("angry");
      const annotationCollectionRef = firebase.firestore().collection("annotation");
      
      // Retrieve list of speech files from Firebase Storage
      storageRef.listAll()
        .then((storageResult) => {
          const storageSpeeches = storageResult.items.map((item) => item.name);
          
          // Retrieve list of annotated speeches from Firestore annotation collection
          annotationCollectionRef.get()
            .then((querySnapshot) => {
              const annotatedSpeeches = querySnapshot.docs.map((doc) => doc.data().filename);
              
              // Find unseen/unannotated speeches that exist in storage but not in Firestore
              const unannotatedFiles  = storageSpeeches.filter((speech) => !annotatedSpeeches.includes(speech));
              setUnannotatedFiles(unannotatedFiles);
              setSuccessMessage('please wait! searching for unannotated speech! it may take a coouple of minute');
              setWarningMessage('');
              // Process the unseen speeches
              unannotatedFiles.forEach((speech) => {
                console.log("Unseen speech:", speech);
                // Perform your desired action with the unseen speech
              });
              if (unannotatedFiles.length === 0) {
                setSuccessMessage('congratulation! you were annotated all speechs! Thanks from the buttom of heart!');
                setWarningMessage('');
              }
            })
            .catch((error) => {
              console.error("Error retrieving annotated speeches from Firestore:", error);
            });
        })
        .catch((error) => {
          console.error("Error retrieving speech files from Firebase Storage:", error);
        });

     };

     //handle unannotated data
     const handleAnnotate = async (file) => {
      console.log("The index of this non-annotated file is " + file);
  
      const folderRef = storage.ref("angry");
      const folderFiles = await folderRef.listAll();
      
      const filteredFile = folderFiles.items.find((item, index) => {
        if (item.name === file) {
          item.index = index;
          return true;
        }
        return false;
      });
      
      if (filteredFile) {
        console.log("Index of the selected file: " + filteredFile.index);
        // Perform activity based on the file name index
        // Example: Call a function or execute code specific to the inde

        const nextIndex = filteredFile.index;
        const nextFileName = audioFiles[nextIndex].name;
        setCurrentAudioIndex(nextIndex);
        setFileName(nextFileName);

      } else {
        console.log("Selected file not found.");
      }
      
      return filteredFile;
     };

const handleSave = () => {
  const audioFileName = fileName;
  const transcription = transcriptionRef.current.value;
  const valence = valenceRef.current.value;
  const arousal = arousalRef.current.value;
  const dominance = dominanceRef.current.value;

  const isValid =
    audioFileName !== '' &&
    transcription !== '' &&
    valence !== '' &&
    !isNaN(valence) &&
    arousal !== '' &&
    !isNaN(arousal) &&
    dominance !== '' &&
    !isNaN(dominance);

  if (!isValid) {
    setWarningMessage('Invalid values. Please enter valid numeric values or the field must not be empty');
    setSuccessMessage('');
    return;
  }

  setSuccessMessage('');
  const data = {
    filename: audioFileName,
    transcription,
    valence,
    arousal,
    dominance,
  };

  if (isValid) {
    // Check if a document with the same filename already exists
    annotationCollection
      .where('filename', '==', audioFileName)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          // No existing document found, create a new one
          return annotationCollection.add(data);
        } else {
          // Existing document found, update it
          const updatePromises = querySnapshot.docs.map((doc) =>
            annotationCollection.doc(doc.id).update(data)
          );
          return Promise.all(updatePromises);
        }
      })
      .then(() => {
        setSuccessMessage('Data saved successfully!');
        setWarningMessage('');
        fetchData();
      })
      .catch((error) => {
        setWarningMessage('Error saving/updating data in Firestore: ' + error);
        setSuccessMessage('');
      });
  }
};


    return (
    <div className="container1">
    <div className="container">
      <p>BAHIR DAR UNIVERSITY</p>
      <p>BAHIR DAR INSTITUTE OF TECHNOLOGY</p>
      
      <h1>Dimensional Amharic Speech Emotion Recognition Annotation Tool</h1>
      <h2>{fileName}</h2>
      <div className="speech-details">
        <button className="play-audio" onClick={handleBackAudio}><img src={backIcon} alt="back" style={{width: '30px', height: '30px'}} /></button>
        <button className="play-audio" onClick={handlePlayAudio}><img src={playIcon} alt="play" style={{width: '30px', height: '30px'}}/></button>
        <button className="play-audio" onClick={handleNextAudio}><img src={nextIcon} alt="next" style={{width: '30px', height: '30px'}}/></button>
        <button className="play-audio" onClick={checkForMissingFiles}>Check for missing files</button>
        <div className="text">
          <label htmlFor="transcription">Transcription:</label>
          <input ref={transcriptionRef} type="text" id="transcription" />
        </div>
        <button ref={saveButtonRef} className="save-button" onClick={handleSave}>Save</button>
        <button className="export-button" onClick={exportToExcel}>export</button>
      </div>
      <div className="input-fields">
        <div className="text-box">
          <label htmlFor="valence">Valence:</label>
          <input ref={valenceRef} type="text" id="valence" />
        </div>
        <div className="text-box">
          <label htmlFor="arousal">Arousal:</label>
          <input ref={arousalRef} type="text" id="arousal" />
        </div>
        <div className="text-box">
          <label htmlFor="dominance">Dominance:</label>
          <input ref={dominanceRef} type="text" id="dominance" />
          </div>
        </div>
      </div>
{/* Display the success message */}
{warningMessage && <div className="warning">{warningMessage}</div>} 
{/* Display the success message */}
{successMessage && <div className="success">{successMessage}</div>}
<div className="Containerrr">
      {/* Your existing JSX code */}
      {/* Add the scrollable container */}
      <div className="scrollable-container">
        <table className="annotation-table">
          <thead>
            <tr>
              <th>File name</th>
              <th>Valence</th>
              <th>Arousal</th>
              <th>Dominance</th>
              <th>Transcription</th>

            </tr>
          </thead>
          <tbody>
            {/* {annotations.map((annotation, index) => (
              <tr key={index}>
                <td>{annotation.filename}</td>
                <td>{annotation.valence}</td>
                <td>{annotation.arousal}</td>
                <td>{annotation.dominance}</td>
                <td>{annotation.transcription}</td>
              </tr>
            ))} */}
          </tbody>
        </table>
        
      </div>
      <div className={`scrollable-container${showUnannotatedTable ? " visible" : "true"}`}>
        <table className="unannotated-table">
          <thead>
            <tr>
              <th>Unannotated File Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {
            unannotatedFiles.map((file, index) => (
              <tr key={index}>
                <td>{file}</td>
                <td>
                  <button onClick={() => handleAnnotate(file)}>Annotate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
</div>

      <div className="note">
      Note: if the speech is prevously annotated and re-annotate and click save, it is automaticaly update the change what you do!
        </div>
      <div className="dimensional">
      Dimensional speech emotion recognition is a technique used to analyze and recognize emotions in speech based on the dimensional model of emotion. Instead of categorizing emotions into discrete categories, this approach focuses on measuring emotional states along continuous dimensions, typically valence, arousal, and dominance.
      </div>
      <div className="valence">
      Valence: Valence describes the overall emotional positivity or negativity conveyed by the speech, indicating whether it evokes pleasant or unpleasant feelings.
      </div>
      <div className="arousal">
      Arousal: Arousal reflects the level of energy or activation present in the speech, indicating whether it elicits high excitement or low calmness.
      </div>
      <div className="dominance">
      Dominance: Dominance signifies the perceived level of control or influence expressed in the speech, indicating whether the speaker appears more authoritative or submissive.
      </div>
    </div>
  );
};

export default Dimensional;