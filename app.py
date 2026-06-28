from flask import Flask, render_template, request, jsonify
import json
import os

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
    return render_template("index.html")


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