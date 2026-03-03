import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, push, update, set, onChildAdded, onChildChanged, onChildRemoved, off } 
from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { 
    getAuth,onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword,  createUserWithEmailAndPassword,signOut, setPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
let canvas;
let inputBox;
let currentObject = -1;
let mouseDown = false;
let promptWords = [];
let ctx;
let auth;
let db;
let exampleName = "something";
let myObjectsByFirebaseKey = {};
let existingSubscribedFolder = null;
const image_size = 150;
let googleAuthProvider;
let mouseX = 0;
let mouseY = 0;
let activeUserFilter = null; // null = show all
let allAuthors = new Set();
let dropdown = null;




//init();
function createAuthScreen() {

    const authScreen = document.createElement("div");
    authScreen.id = "authScreen";
    authScreen.style.position = "fixed";
    authScreen.style.inset = "0";
    authScreen.style.background = "linear-gradient(#c8e6c9, #81c784)";
    authScreen.style.display = "flex";
    authScreen.style.justifyContent = "center";
    authScreen.style.alignItems = "center";
    authScreen.style.fontFamily = "Arial, sans-serif";
    authScreen.style.zIndex = "5000";

    // Card container
    const card = document.createElement("div");
    card.style.background = "white";
    card.style.padding = "40px";
    card.style.borderRadius = "25px";
    card.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.minWidth = "320px";

    const title = document.createElement("h1");
    title.innerText = "Thought Garden 🌿";
    title.style.color = "#1B5E20";
    title.style.marginBottom = "25px";

    function styleInput(input) {
        input.style.margin = "8px 0";
        input.style.padding = "10px 15px";
        input.style.fontSize = "16px";
        input.style.borderRadius = "25px";
        input.style.border = "2px solid #1B5E20";
        input.style.outline = "none";
        input.style.width = "250px";
        input.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    }

    function styleButton(button) {
        button.style.margin = "8px 0";
        button.style.padding = "8px 16px";
        button.style.fontSize = "14px";
        button.style.borderRadius = "20px";
        button.style.border = "2px solid #1B5E20";
        button.style.backgroundColor = "white";
        button.style.color = "#1B5E20";
        button.style.cursor = "pointer";
        button.style.transition = "0.2s ease";
        button.onmouseenter = () => {
            button.style.backgroundColor = "#1B5E20";
            button.style.color = "white";
        };
        button.onmouseleave = () => {
            button.style.backgroundColor = "white";
            button.style.color = "#1B5E20";
        };
    }

    const emailInput = document.createElement("input");
    emailInput.placeholder = "Email";
    emailInput.type = "email";
    styleInput(emailInput);

    const passwordInput = document.createElement("input");
    passwordInput.placeholder = "Password";
    passwordInput.type = "password";
    styleInput(passwordInput);

    const signInBtn = document.createElement("button");
    signInBtn.innerText = "Sign In";
    styleButton(signInBtn);

    const signUpBtn = document.createElement("button");
    signUpBtn.innerText = "Sign Up";
    styleButton(signUpBtn);

    const googleBtn = document.createElement("button");
    googleBtn.innerText = "Continue with Google";
    styleButton(googleBtn);
    googleBtn.style.marginTop = "15px";

    card.appendChild(title);
    card.appendChild(emailInput);
    card.appendChild(passwordInput);
    card.appendChild(signInBtn);
    card.appendChild(signUpBtn);
    card.appendChild(googleBtn);

    authScreen.appendChild(card);
    document.body.appendChild(authScreen);

    signInBtn.onclick = () => {
        signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
            .catch(err => alert(err.message));
    };

    signUpBtn.onclick = () => {
        createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
            .catch(err => alert(err.message));
    };

    googleBtn.onclick = () => {
        signInWithPopup(auth, googleAuthProvider)
            .catch(err => alert(err.message));
    };
}


function init() {
    // Perform initialization logic here
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
     

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.left = "0px";
    canvas.style.top = "0px";
    canvas.style.zIndex = "5";   // behind input box

    document.body.appendChild(canvas);

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";

    initInterface();
    animate();
    //initFirebaseDB();
    subscribeToData();
}

// Animate loop
function animate() {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let key in myObjectsByFirebaseKey) {
        let thisObject = myObjectsByFirebaseKey[key];
        if (activeUserFilter &&thisObject.authorName !== activeUserFilter) {
         continue;
          }
        if (thisObject.type === "image") {
            let position = thisObject.position;
            let img = thisObject.loadedImage;
            if (img) {
                //ctx.fillStyle = "black";
                //ctx.font = "30px Arial";
                //ctx.fillText(thisObject.prompt, position.x, position.y - 30);
                position.x = Math.max(0, Math.min(position.x, canvas.width - image_size));
                ctx.drawImage(img, position.x, position.y, image_size, image_size);
            }
            const isHovering =
            mouseX > position.x &&
            mouseX < position.x + image_size &&
            mouseY > position.y &&
            mouseY < position.y + image_size;

        if (isHovering && thisObject.authorName) {

            ctx.save();

            // subtle fade background
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(
                position.x,
                position.y + image_size,
                image_size,
                25
            );

            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                thisObject.authorName,
                position.x + image_size / 2,
                position.y + image_size + 17
            );

            ctx.restore();
        }
            //  if (thisObject.authorName) {
            // ctx.fillStyle = "#1B5E20";
            // ctx.font = "16px Arial";
            // ctx.textAlign = "center";

            // ctx.fillText(
            //     thisObject.authorName,
            //     position.x + image_size / 2,
            //     position.y + image_size + 20
            //);
        } else if (thisObject.type === "text") {
            let position = thisObject.position;
            ctx.font = "30px Arial";
            ctx.fillText(thisObject.text, position.x, position.y);
        }
    }

    requestAnimationFrame(animate);
}



async function askPictures(promptWord, location) {
    inputBox.value = promptWord;
    document.body.style.cursor = "progress";
    let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    let authToken = "";
    //Optionally Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
    let thisPromptWord = {
        word: promptWord,
        location: location,
    }
    promptWords.push(promptWord);

    document.body.style.cursor = "progress";
    const data = {
        model: "black-forest-labs/flux-schnell",
        input: {
            prompt: promptWord + 'written inside of a random type of flower with a grass background',
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(replicateProxy, options);
    //turn it into json
    const json_response = await raw_response.json();
    document.body.style.cursor = "auto";
    console.log("json_response", json_response);

    if (json_response.length == 0) {
        console.log("Something went wrong, try it again");
    } else {

        let img = document.createElement("img");
        //document.body.appendChild(img);
        img.style.position = 'absolute';
        img.style.left = location.x + 'px';
        img.style.top = location.y + 'px';
        img.style.width = '256px';
        img.style.height = '256px';
        img.src = json_response.output;

        addImageRemote(json_response.output, promptWord, { x: location.x, y: location.y });
        //don't add it locally, we will get it from firebase addChildAdded callback
    }
    document.body.style.cursor = "auto";

    inputBox.style.display = 'block';
    inputBox.value = '';
}



function initInterface() {
    // Get the input box

    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'Enter text here');
    inputBox.type = 'text';
    inputBox.placeholder = 'Plant a persistent thought in the garden...';

   inputBox.style.position = 'fixed';
   inputBox.style.left = '50%';
   inputBox.style.bottom = '40px';   // distance from bottom
   inputBox.style.transform = 'translateX(-50%)';

   
   inputBox.style.width = 'auto';
   inputBox.style.minWidth = '400px';

    inputBox.addEventListener('input', () => {
    inputBox.style.width = 'auto';
    inputBox.style.width = (inputBox.scrollWidth + 20) + 'px';
   });

   inputBox.style.padding = '10px 15px';
   inputBox.style.fontSize = '18px';
   inputBox.style.fontFamily = 'Arial, sans-serif';

   inputBox.style.borderRadius = '25px';  // rounded corners
   inputBox.style.border = '2px solid #1B5E20'; // dark green
   inputBox.style.outline = 'none';

   inputBox.style.backgroundColor = 'white';
   inputBox.style.color = '#1B5E20';

   inputBox.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
   inputBox.style.zIndex = '10';

    document.body.appendChild(inputBox);
    inputBox.setAttribute('autocomplete', 'off');

    inputBox.addEventListener("focus", () => {
    inputBox.style.boxShadow = '0 0 10px rgba(27, 94, 32, 0.4)';
});

inputBox.addEventListener("blur", () => {
    inputBox.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
});

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            var rect = inputBox.getBoundingClientRect()
            let location = { x: rect.left, y: rect.top };
            console.log("Location: ", location);
            askPictures(inputValue, location);
            //inputBox.style.display = 'none';
        }
    });



    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        mouseDown = true;
        // Check if the mouse is clicked on any of the words
        currentObject = -1;
        for (let key in myObjectsByFirebaseKey) {
            let thisObject = myObjectsByFirebaseKey[key];
            //need to check if the mouse is over the object using the position and width and height
            if (event.clientX > thisObject.position.x && event.clientX < thisObject.position.x + image_size && event.clientY > thisObject.position.y && event.clientY < thisObject.position.y + 255) {
                currentObject = key;
                break;
            }
        }
        console.log("Clicked on ", currentObject);
    });

    document.addEventListener('mousemove', (event) => {

          mouseX = event.clientX;
          mouseY = event.clientY;
        //move words around

        if (mouseDown && currentObject != -1) {

            let thisLocation = { x: event.clientX, y: event.clientY };
            myObjectsByFirebaseKey[currentObject].position = thisLocation;
        }

    });
    document.addEventListener('mouseup', (event) => {
        if (currentObject != -1) {
            let thisLocation = myObjectsByFirebaseKey[currentObject].position;
            updateJSONFieldInFirebase(exampleName + "/" + currentObject + "/position/", { x: thisLocation.x, y: thisLocation.y });
        }
        mouseDown = false


    });
}
 





///////////////////////FIREBASE///////////////////////////

export function addImageRemote(imgURL, prompt, pos) {
    const user = auth.currentUser;
    console.log("addImageRemote", imgURL, prompt, pos);
    const data = { type: "image", prompt: prompt, position: pos, imageURL: imgURL, authorName: user.displayName || user.email };
    let folder = "sharedImages/";
    console.log("Entered Image, Send to Firebase", folder, data);
    const key = addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
    return key;
}


function initFirebaseDB() {
    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDZMNtQPl-bqPxufr5z8aws6_1nWOPGwMo",
        authDomain: "class-test-3c1ff.firebaseapp.com",
        databaseURL: "https://class-test-3c1ff-default-rtdb.firebaseio.com/",
       projectId: "class-test-3c1ff",
       storageBucket: "class-test-3c1ff.firebasestorage.app",
       messagingSenderId: "422334713781",
       appId: "1:422334713781:web:9717c2b43f5b23bdaad3fc"
    };
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
    setPersistence(auth, browserSessionPersistence);
    googleAuthProvider = new GoogleAuthProvider();

}

//  onAuthStateChanged(auth, (user) => {
//     if (user) {
//         // User is signed in, see docs for a list of available properties
//         // https://firebase.google.com/docs/reference/js/auth.user
//         const uid = user.uid;
//         console.log("userino is signed in", user);
//         showLogOutButton(user);
//         // ...
//     } else {
//         console.log("userino is signed out");
//         showLoginButtons();
//         // User is signed out
//         // ...
//     }
// });

function addNewThingToFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    const dbRef = ref(db, folder);
    const newKey = push(dbRef, data).key;
    return newKey; //useful for later updating
}

async function updateJSONFieldInFirebase(folder, data) {
    console.log("updateDataInFirebase", folder, data);
    const dbRef = ref(db, folder);
    try {
        await update(dbRef, data);
        // console.log("update ok");
    } catch (e) {
        console.error("update error", e);
    }
}


function setDataInFirebase(folder, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    console.log("setDataInFirebase", folder, data);
    const dbRef = ref(db, folder)
    set(dbRef, data);

}

function deleteFromFirebase(folder, key) {
    console.log("deleting", folder + '/' + key);
    const dbRef = ref(db, folder + '/' + key);
    set(dbRef, null);
}

function subscribeToData() {
    const sharedRef = ref(db, "sharedImages");

    // Clear old listeners if needed
    if (existingSubscribedFolder) {
        off(ref(db, existingSubscribedFolder));
    }

    existingSubscribedFolder = "sharedImages";

    onChildAdded(sharedRef, (snapshot) => {

        const key = snapshot.key;
        const data = snapshot.val();

        myObjectsByFirebaseKey[key] = data;

        if (data.authorName) {
            allAuthors.add(data.authorName);
            renderUserDropdown();
        }

        if (data.type === "image") {
            let img = new Image();
            img.onload = function () {
                myObjectsByFirebaseKey[key].loadedImage = img;
            };
            img.src = data.imageURL;
        }
    });

    onChildChanged(sharedRef, (snapshot) => {
        const key = snapshot.key;
        const value = snapshot.val();
        myObjectsByFirebaseKey[key] = value;
    });

    onChildRemoved(sharedRef, (snapshot) => {
        const key = snapshot.key;
        delete myObjectsByFirebaseKey[key];
    });
   

}

let authDiv = document.createElement("div");
authDiv.style.position = "fixed";
authDiv.style.top = "30px";
authDiv.style.right = "30px";

authDiv.style.padding = "8px 14px";
authDiv.style.fontSize = "14px";
authDiv.style.fontFamily = "Arial, sans-serif";

authDiv.style.borderRadius = "25px";
authDiv.style.border = "2px solid #1B5E20";
authDiv.style.backgroundColor = "white";
authDiv.style.color = "#1B5E20";

authDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
authDiv.style.cursor = "pointer";

authDiv.style.zIndex = "3000";

document.body.appendChild(authDiv);





function styleDropdownItem(item) {
    item.style.padding = "4px 8px";
    item.style.cursor = "pointer";
    item.style.borderRadius = "10px";

    item.onmouseenter = () => {
        item.style.background = "#1B5E20";
        item.style.color = "white";
    };

    item.onmouseleave = () => {
        item.style.background = "white";
        item.style.color = "#1B5E20";
    };
}

function renderUserDropdown() {

    dropdown.innerHTML = "";

    // "All Users" option
    let allOption = document.createElement("div");
    allOption.innerText = "All Users";
    styleDropdownItem(allOption);
    allOption.onclick = () => {
        activeUserFilter = null;
        dropdown.style.display = "none";
    };
    dropdown.appendChild(allOption);

    allAuthors.forEach(name => {
        let item = document.createElement("div");
        item.innerText = name;
        styleDropdownItem(item);

        item.onclick = () => {
            activeUserFilter = name;
            dropdown.style.display = "none";
        };

        dropdown.appendChild(item);
    });
}

function showLogOutButton(user) {
    authDiv.innerHTML = "";
    let userNameDiv = document.createElement("div");
    //if (user.photoURL) {
     //   let userPic = document.createElement("img");
      //  userPic.src = user.photoURL;
     //   userPic.style.width = "50px";
       // userPic.style.height = "50px";
      //  authDiv.appendChild(userPic);
    //}
    if (user.displayName) {
        userNameDiv.innerHTML = user.displayName;
    } else {
        userNameDiv.innerHTML = user.email;
    }
    let logOutButton = document.createElement("button");
     logOutButton.style.marginTop = "5px";
     logOutButton.style.padding = "4px 10px";
    logOutButton.style.fontSize = "12px";
    logOutButton.style.borderRadius = "15px";
    logOutButton.style.border = "1px solid #1B5E20";
    logOutButton.style.backgroundColor = "white";
    logOutButton.style.color = "#1B5E20";
    logOutButton.style.cursor = "pointer";
    authDiv.appendChild(userNameDiv);
    logOutButton.innerHTML = "Log Out";
    logOutButton.setAttribute("id", "logOut");
    logOutButton.setAttribute("class", "authButton");
    authDiv.appendChild(logOutButton);
    document.getElementById("logOut").addEventListener("click", function () {
        signOut(auth).then(() => {
            // Sign-out successful.
            console.log("signed out");
        }).catch((error) => {
            // An error happened.
            console.log("error signing out");
        });
    });

    // Create dropdown container
   dropdown = document.createElement("div");
   dropdown.style.position = "absolute";
   dropdown.style.top = "100%";
    dropdown.style.right = "0";
   dropdown.style.marginTop = "6px";
   dropdown.style.background = "white";
   dropdown.style.border = "2px solid #1B5E20";
   dropdown.style.borderRadius = "15px";
   dropdown.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
   dropdown.style.padding = "6px";
   dropdown.style.display = "none";
   dropdown.style.fontSize = "13px";

authDiv.appendChild(dropdown);

// Small arrow toggle
let arrow = document.createElement("div");
arrow.innerText = "▼";
arrow.style.fontSize = "12px";
arrow.style.cursor = "pointer";
arrow.style.marginTop = "4px";

authDiv.appendChild(arrow);

arrow.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.display =
        dropdown.style.display === "none" ? "block" : "none";
});

// Close when clicking elsewhere
document.addEventListener("click", () => {
    dropdown.style.display = "none";
});


}

function showLoginButtons() {
    authDiv.innerHTML = "";
    let signUpWithGoogleButton = document.createElement("button");
    signUpWithGoogleButton.innerHTML = "Google Login";
    signUpWithGoogleButton.setAttribute("id", "signInWithGoogle");
    signUpWithGoogleButton.setAttribute("class", "authButton");
    authDiv.appendChild(signUpWithGoogleButton);

    authDiv.appendChild(document.createElement("br"));
    authDiv.appendChild(document.createElement("br"));

    let emailDiv = document.createElement("div");
    emailDiv.innerHTML = "Email";
    authDiv.appendChild(emailDiv);

    let emailInput = document.createElement("input");
    emailInput.setAttribute("id", "email");
    emailInput.setAttribute("class", "authInput");
    emailInput.setAttribute("type", "text");
    emailInput.setAttribute("placeholder", "email@email.com");
    authDiv.appendChild(emailInput);

    let passwordInput = document.createElement("input");
    passwordInput.setAttribute("id", "password");
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute("class", "authInput");
    passwordInput.setAttribute("placeholder", "password");
    passwordInput.setAttribute("suggest", "current-password");
    passwordInput.setAttribute("autocomplete", "on");
    authDiv.appendChild(passwordInput);

    let signUpWithEmailButton = document.createElement("button");
    signUpWithEmailButton.innerHTML = "Sign Up";
    signUpWithEmailButton.setAttribute("id", "signUpWithEmail");
    signUpWithEmailButton.setAttribute("class", "authButton");
    authDiv.appendChild(signUpWithEmailButton);

    let signInWithEmailButton = document.createElement("button");
    signInWithEmailButton.innerHTML = "Sign In";
    signInWithEmailButton.setAttribute("id", "signInWithEmail");
    signInWithEmailButton.setAttribute("class", "authButton");
    authDiv.appendChild(signInWithEmailButton);

    document.getElementById("signInWithGoogle").addEventListener("click", function (event) {
        signInWithPopup(auth, googleAuthProvider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                // IdP data available using getAdditionalUserInfo(result)
                // ...
            }).catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.customData.email;
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error);
                // ...
            });
        event.stopPropagation();
    });

    document.getElementById("signInWithEmail").addEventListener("click", function (event) {
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
            });
        event.stopPropagation();
    });

    document.getElementById("signUpWithEmail").addEventListener("click", function (event) {
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                console.log(user);
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                // ..
            });
        event.stopPropagation();
    });
}

initFirebaseDB();
//createAuthScreen();

onAuthStateChanged(auth, (user) => {

    if (user) {

        console.log("User logged in:", user.email);

        // Remove auth screen if it exists
        const screen = document.getElementById("authScreen");
        if (screen) screen.remove();

        exampleName = user.uid;

        showLogOutButton(user);

        init();

    } else {

        console.log("User logged out");

        // Clear canvas objects
        myObjectsByFirebaseKey = {};

        // Remove garden canvas if it exists
        if (canvas) {
            canvas.remove();
        }

        // Show authentication screen again
        createAuthScreen();
    }
});
