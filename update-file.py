import requests
import json
import datetime
teamId = {
    6903: "Lucknow Super Giants",
    6904: "Gujarat Titans",
    4340: "Royal Challengers Bangalore",
    4341: "Kolkata Knight Riders",
    4342: "Punjab Kings",
    4343: "Chennai Super Kings",
    4344: "Delhi Capitals",
    4345: "Rajasthan Royals",
    4346: "Mumbai Indians",
    5143: "Sunrisers Hyderabad"
};
f = open('src/assets/matches.json', 'r')
 
matches = json.load(f)
f.close()
tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
print(tomorrow)
for i in matches['matchesScheduled']:
    matchDate = datetime.datetime.strptime(i['matchDate'], "%Y-%m-%dT%H:%M:%S.%fZ")
    if matchDate < tomorrow:
        data = requests.get('https://hs-consumer-api.espncricinfo.com/v1/pages/match/home?lang=en&seriesId=1298423&matchId=' + str(i['matchId']))
        match = data.json()
        if match['match']['state'] == "POST":
            print(i['homeTeam']+' - '+i['visitingTeam'])
            matchData = {}
            matchData['matchDate'] = match['match']['startDate']
            matchData['matchId'] = match['match']['objectId']
            matchData['homeTeam'] = next((item for item in match['match']['teams'] if item["isHome"] == True), None)['team']['longName']
            matchData['visitingTeam'] = next((item for item in match['match']['teams'] if item["isHome"] == False), None)['team']['longName']
            firstInnings = next((item for item in match['content']['scorecardSummary']['innings'] if item['inningNumber'] == "1"), None)
            secondInnings = next((item for item in match['content']['scorecardSummary']['innings'] if item['inningNumber'] == "2"), None)
            matchData['battingFirst'] = firstInnings['team']['longName']
            matchData['battingSecond'] = secondInnings['team']['longName']
            matchData['firstInningsScore'] = firstInnings['runs']
            matchData['secondInningsScore'] = secondInnings['runs']
            matchData['firstInningsBalls'] = firstInnings['balls']
            matchData['secondInningsBalls'] = secondInnings['balls']
            matchData['firstInningsBallsForNRR'] = firstInnings['balls']
            matchData['secondInningsBallsForNRR'] = secondInnings['balls']
            matchData['firstInningsWickets'] = firstInnings['wickets']
            matchData['secondInningsWickets'] = secondInnings['wickets']
            if matchData['firstInningsWickets'] == 10: 
                matchData['firstInningsBallsForNRR'] = 120;
            
            if matchData['secondInningsWickets'] == 10:
                matchData['secondInningsBallsForNRR'] = 120;
            
            matchData['winner'] = teamId[match['match']['winnerTeamId']];
            matches['matchResults'].append(matchData);
            print(len(matches['matchesScheduled']))
            matches['matchesScheduled'] = [d for d in matches['matchesScheduled'] if d['matchId'] != matchData['matchId']]
            print(len(matches['matchesScheduled']))
        else: 
            print(i['homeTeam']+' - '+i['visitingTeam'])
            print('MATCH YET TO HAPPEN OR IN PROGRESS');
fr = open('src/assets/matches.json', 'w')
json.dump(matches, fr, sort_keys=True, indent=2)
f.close()
