# Alphabet-Animal 🐾

An interactive, toddler-friendly learning app for exploring letters, phonics, tracing, spelling, counting, and number recognition.

## 📝 The Story

My younger child is 2 years old and is absolutely obsessed with the alphabet. I created this project to turn that curiosity into a playful learning experience with letters, sounds, animals, everyday objects, foods, and numbers.

## 🚀 Live Demo

**[Check out the live app here!](https://surfshad0w.github.io/Alphabet-Animal)**

## 🎮 Activities

The app includes multiple touch-friendly learning modes:

* **Letters:** Browse A-Z tiles across Animals, Household, and Food modes, with pronunciation, sounds, facts, and habitat/source cards.
* **Sketch:** Trace uppercase or lowercase letters with a thick crayon brush, color choices, undo/clear, coverage-based accuracy, celebrations, and auto-advance.
* **Quiz:** Pick the correct starting letter for the displayed animal, item, or food.
* **Match:** Play memory matching with letter + emoji pairs or uppercase + lowercase pairs.
* **Phonics:** Hear a letter sound and choose the matching letter.
* **Feed:** Feed the displayed animal, item, or food the correct letter.
* **Pop:** Pop bubbles that match the target letter before they float away.
* **Spell:** Build short words from shuffled letter buttons.
* **Numbers:** Open the dedicated [Numbers 1–50 page](numbers.html) to browse all 50 number tiles, hear each number spoken, and see its quantity in groups of ten.

## ✨ Features

* Progress tracking for explored letters, explored numbers, and completed tracing.
* Speech prompts, sound effects, and celebration feedback.
* Responsive layout designed for phones, tablets, and desktop browsers.
* Touch-first canvas interactions for finger tracing.
* No external APIs or backend required.

## 🛠️ Tech Stack

This repository currently ships as a portable static app:

* **Markup:** HTML
* **Styling:** CSS
* **Logic:** Vanilla JavaScript
* **Deployment:** GitHub Pages

The alphabet experience lives in `index.html`; the dedicated number experience is in `numbers.html`, with its styles in `numbers.css` and behavior in `numbers.js`.

## 💻 Local Development

No dependency install or build step is required.

Open `index.html` directly in a browser, or run a small local server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

The number page is available at `http://localhost:8000/numbers.html`.

## 🏗️ Deployment

The app is ready for static hosting. Push changes to the configured GitHub Pages branch and GitHub Pages will serve `index.html` and `numbers.html`.
