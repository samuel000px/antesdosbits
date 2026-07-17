# Before the Bits

**Before the Bits** is a playable museum about the history of computing, featuring interactive experiences inspired by punched cards, early programming, IBM machines, FORTRAN, debugging, and artificial intelligence.

The project was built with HTML, CSS, and vanilla JavaScript, with Supabase integration for authentication, global ranking, online rooms, and machine learning training data.

## Features

- Interactive timeline of computing history
- Educational games about punched cards
- Login and registration system
- Global player ranking
- Dedicated tutorials for each stage
- Multiplayer mode in the modern computing stage
- AI lab for recognizing punched cards (still in development)
- Local training with TensorFlow.js
- Dataset synchronization with Supabase

## Stages

- **Jacquard Loom**: introduces the use of punched cards to control patterns.
- **Hollerith Census**: simulates the use of punched cards for data processing.
- **IBM Era**: experience inspired by corporate machines based on punched cards.
- **FORTRAN**: build instructions as if they were stacks of punched cards.
- **Bug Hunt**: investigate failures in punched cards.
- **Modern Computing**: online memory-based competition using punched cards.
- **AI Scanner**: machine learning lab for detecting instructions in punched cards.

## Technologies

- HTML5
- CSS3
- JavaScript
- Supabase
- TensorFlow.js

## How to Run

This is a static web project. To run it, open the `index.html` file in your browser.

Connected features such as login, ranking, online rooms, and AI sample storage require the Supabase configuration in `db.js`.

## Project Structure

```text
.
├── index.html
├── style.css
├── theme.css
├── script.js
├── db.js
├── login.html
├── cadastro.html
├── Jacquard/
├── Censo de Hollerith/
├── IBM/
├── Fortran/
├── CacaErro/
├── ComputacaoModerna/
├── MachineLearningCartoes/
├── assets/
└── output/
