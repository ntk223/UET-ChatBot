cd nlu-engine
source venv/bin/activate
sleep 2
rasa train
rasa run --enable-api