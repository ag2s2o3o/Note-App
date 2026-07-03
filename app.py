from flask import Flask, render_template, request, jsonify
import json
import os
import random

app = Flask(__name__)

DATA_FILE = "data/notes.json"


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"folders": []}

    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)


@app.route("/")
def index():
    tracks = [
        "01 R.E. 1 Save Room- Safe Haven.mp3",
        "02 R.E. 2 Save Room- Secure Place.mp3",
        "06 R.E. 4 Save Theme.mp3",
        "re7_save_theme.mp3"
    ]
    chosen_track = random.choice(tracks)
    return render_template("index.html", track_file=chosen_track)


@app.route("/notes")
def get_notes():
    return jsonify(load_data())


@app.route("/save", methods=["POST"])
def save():

    data = request.json

    save_data(data)

    return jsonify({"status": "success"})


if __name__ == "__main__":
    app.run(debug=True)