# IonX Studios website

Static site (HTML, CSS and vanilla JS, no build step) for IonX Studios.

- `index.html`: the page
- `styles.css`: styles (brand blue `#1E19FF` and white)
- `main.js`: interactions (custom cursor, magnetic buttons, ion-field hero, spinning pinwheel, scroll reveals, SAINT screenshot tabs, split-screen demo, contact form)
- `assets/`: logo and SAINT screenshots

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Import the repo in Vercel with the "Other" framework preset; there is nothing to build.

## Contact form

The form posts to [FormSubmit](https://formsubmit.co) for `IonX.Dev@gmail.com` and sends the sender an automatic reply
(`_autoresponse` in `index.html`). The first submission sends a one-time activation email to that inbox; click the
link in it and the form is live.
