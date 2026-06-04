cd nlu-engine
source venv/bin/activate
sleep 2
rasa train

source venv/bin/activate
kill -9 $(lsof -ti :5005)
rasa run --enable-api --cors "*"

kill -9 $(lsof -ti :5055)
rasa run actions

kill -9 $(lsof -ti :5006)
python auth_server.py
