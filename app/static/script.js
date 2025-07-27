function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function keyboardLetter(letter) {
    return document.getElementById(`letter-${letter}`);
}

function lightUp(element){
    element.style.animation = "none";
    element.offsetHeight; // Trigger reflow
    element.style.animation = "light 0.1s ease-in-out";
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.getElementsByClassName('toast-body')[0].innerText = message;
    toast.style.animation = "none";
    toast.offsetHeight; // Trigger reflow
    toast.style.animation = "flyIn 0.5s ease-in-out forwards";
    toast.style.display = 'block';
    toast.classList.add('show');
}

const word_length = parseInt(window.wordLength);
const csrfToken = getCookie("csrftoken");
const revealTime = 0.3;
const guessingRows = document.querySelectorAll('.game-row');
let currentRow = 0;
let inputString = '';

let finished = window.already_finished;
finished = window.already_finished === 'True';

let win_message = "You won!"

window.addEventListener('keydown', (e) => {
    handleKeyDown(e.key);
});

alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
alphabet.forEach(letter => {
    keyboardLetter(letter).addEventListener('click', () => {
        handleKeyDown(letter);
    });
})
keyboardLetter('enter').addEventListener('click', () => {
    handleKeyDown('Enter');
})
keyboardLetter('back').addEventListener('click', () => {
    handleKeyDown('Backspace');
})

function handleKeyDown(key){
        if (finished) return;

    if (key === 'Backspace') {
        lightUp(keyboardLetter("back"));
    }
    else if(key === 'Enter'){
        lightUp(keyboardLetter("enter"));
    }
    else if(alphabet.includes(key.toLowerCase())) {
        lightUp(keyboardLetter(key.toLowerCase()));
    }

    const currentGuessingRow = guessingRows[currentRow];
    const rowBoxes = Array.from(currentGuessingRow.children);
    const isLetter = /^[a-zA-Z]$/.test(key);

    if (isLetter && inputString.length < word_length) {
        inputString += key.toUpperCase();
    } else if (key === 'Backspace') {
        inputString = inputString.slice(0, -1);
    } else if (key === 'Enter') {
        if (inputString.length === word_length) {
            makeGuess(inputString, currentGuessingRow, rowBoxes);
        } else {
            currentGuessingRow.classList.add('wiggle');
            setTimeout(() => {
                currentGuessingRow.classList.remove('wiggle');
            }, 500);
        }
    }

    if (key !== 'Enter') {
        updateRowLetters(rowBoxes, inputString);
    }
}

window.addEventListener("load", () => {

    if(finished){
        showToast(win_message);
    }

    let previous_guesses = strToArray(window.previousGuesses);
    let colors = strToArray(window.colors)
    
    previous_guesses.forEach((guess, index) => {
        if (index < guessingRows.length) {
            const rowBoxes = Array.from(guessingRows[index].children);
            for (let i = 0; i < word_length; i++) {
                rowBoxes[i].textContent = guess[i] || '';
            }
        }
    });

    colors.forEach((word, i) => {
        word.forEach((color,j) =>{
            const box = Array.from(guessingRows[i].children)[j];
            box.style.animation = `${color} ${revealTime}s ease-in-out forwards ${(i+j) * revealTime / 5}s`
            const keyboardLetterElement = keyboardLetter(box.textContent.toLowerCase());
            keyboardLetterElement.classList.add(`${color}-keyboard`);
        })
    })

    currentRow = previous_guesses.length;
});

function strToArray(string){
    const txt = document.createElement("textarea");
    txt.innerHTML = string;
    const decoded = txt.value;

    const jsonReady = decoded.replace(/'/g, '"');
    array = JSON.parse(jsonReady).reverse();
    return array
}


function makeGuess(guess, currentGuessingRow, rowBoxes) {
    fetch("/check-guess/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({ guess: guess })
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid_word) {
            const colorResults = data.result;
            for (let i = 0; i < word_length; i++) {
                rowBoxes[i].style.animation = `${colorResults[i]} ${revealTime}s ease-in-out forwards ${i * revealTime}s`;
                keyboardLetter(guess[i].toLowerCase()).classList.add(`${colorResults[i]}-keyboard`);
            }
            if (data.correct_guess) {
                setTimeout(() => {
                    showToast(win_message);
                }, revealTime * word_length * 1000);
                finished = true;
            } else if (currentRow < guessingRows.length - 1) {
                currentRow++;
                inputString = '';
            } else {
                finished = true;
            }
        }
        else {
            currentGuessingRow.classList.add('wiggle');
            setTimeout(() => {
                currentGuessingRow.classList.remove('wiggle');
            }, 500);
        }
    })
    .catch(err => {
        console.error("Guess check failed:", err);
    });
}


function updateRowLetters(rowBoxes, input) {
    for (let i = 0; i < word_length; i++) {
        rowBoxes[i].textContent = input[i] || '';
    }
}

