cd nlu-engine
source venv/bin/activate
sleep 2
rasa train

kill -9 $(lsof -ti :5005)
rasa run --enable-api --cors "*"

kill -9 $(lsof -ti :5055)
rasa run actions

