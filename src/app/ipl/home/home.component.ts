import { Component, OnInit, ViewChild } from '@angular/core';
import matches from '../../../assets/matches.json';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortable } from '@angular/material/sort';
import { logos } from '../util';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  pointsTable: any[] = [];
  teams = ["Lucknow Super Giants", "Gujarat Titans", "Royal Challengers Bangalore",
    "Kolkata Knight Riders", "Punjab Kings", "Chennai Super Kings", "Delhi Capitals",
    "Rajasthan Royals", "Mumbai Indians", "Sunrisers Hyderabad"];
  displayedColumns: string[] = ['name', 'played', 'wins', 'lost', 'nrr', 'points'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  matchesScheduled: any[] = [];
  teamLogos = logos;
  adjustValues: any = {
    'add': 1,
    'reduce': -1
  };
  counterTeamType: any = {
    home: 'visiting',
    visiting: 'home'
  };
  matchResults: any[] = matches.matchResults;
  @ViewChild(MatSort) sort: MatSort = new MatSort();
  constructor() { }
  overValueBlurr(i: number, focEvent: any) {
    if (focEvent) {
      var value: string = this.matchesScheduled[i].homeOversBowled + '';
      var isError = (typeof (+value) != "number") || (+value < 0) || (+value >= 20) || (+value.split(".")[1] > 5);
      if (isError) {
        this.matchesScheduled[i].homeOversError = true;
      } else {
        this.matchesScheduled[i].homeOversError = false;
      }
    } else {
      (focEvent.target as HTMLInputElement).value = '';
    }
  }
  ngOnInit(): void {
    this.matchesScheduled = matches.matchesScheduled.filter(each=>each.homeTeam!='TBA'); 
    this.matchesScheduled.forEach(each => {
      each.homeTeamBattingFirst = true;
      each.visitingTeamBattingFirst = false;
      each.homeTeamWon = false;
      each.visitingTeamWon = false;
      each.isComplete = false;
    });
    this.matchesScheduled.sort((a: any, b: any)=>{
      var sortval = new Date(a.matchDate)<new Date(b.matchDate)?-1:new Date(b.matchDate)<new Date(a.matchDate)?1:0;
      return sortval
    });
    this.generatePointsTable();
    this.dataSource.sort = this.sort;
    this.dataSource.data.sort((a: any, b: any) => {
      if (a.wins > b.wins) {
        return -1;
      } else if (a.wins < b.wins) {
        return 1;
      } else if (a.wins == b.wins && a.nrr < b.nrr) {
        return 1;
      } else if (a.wins == b.wins && a.nrr > b.nrr) {
        return -1;
      } else {
        return 0;
      }
    });
  }
  battingFirstToggle(index: number, teamType: string, $event: any) {
    this.matchesScheduled[index][this.counterTeamType[teamType] + "TeamBattingFirst"] = !$event.checked;
    this.matchesScheduled[index].homeOversBowled = 0.0;
    this.matchesScheduled[index].visitingOversBowled = 0.0;
    this.matchesScheduled[index].homeRunsScored = 0;
    this.matchesScheduled[index].visitingRunsScored = 0;
  }
  resultToggle(index: number, teamType: string, $event: any) {
    this.matchesScheduled[index][this.counterTeamType[teamType] + "TeamWon"] = !$event.checked;
  }
  adjustOvers(teamType: string, index: number, operation: string) {
    var overs = this.matchesScheduled[index][teamType + "OversBowled"];
    if (overs == undefined) {
      overs = 0;
    }
    if (operation == 'reduce' && overs <= 0.1) {
      return;
    }
    if (operation == 'add' && overs == 20) {
      return;
    }
    let adjustment = (0.1 * this.adjustValues[operation]);
    if (operation == 'add' && (overs + '').endsWith(".5")) {
      adjustment = 0.5;
    } else if (operation == 'reduce' && (overs + '').endsWith(".0")) {
      adjustment = -0.5;
    }
    overs = (Math.round((+overs + +adjustment) * 10) / 10).toFixed(1);
    this.matchesScheduled[index][teamType + "OversBowled"] = overs;
  }
  adjustRuns(teamType: string, index: number, operation: string) {
    var runs = this.matchesScheduled[index][teamType + "RunsScored"];
    if (runs == undefined) {
      runs = 0;
    }
    if (operation == 'reduce' && runs == 0) {
      return;
    }
    runs = runs + this.adjustValues[operation];
    this.matchesScheduled[index][teamType + "RunsScored"] = runs;
  }
  generatePointsTable() {
    this.pointsTable = this.teams.map(eachTeam => {
      let team: any = {};
      team.name = eachTeam;
      team.played = this.matchResults.filter(each => [each.homeTeam, each.visitingTeam].includes(eachTeam)).length;
      team.wins = this.matchResults.filter(each => each.winner === eachTeam).length;
      team.bowledBalls = this.matchResults.filter(each => [each.battingFirst, each.battingSecond].includes(eachTeam))
        .reduce((balls, obj) => {
          if (obj.battingFirst == eachTeam) {
            return balls + obj.secondInningsBalls;
          } else if (obj.battingSecond == eachTeam) {
            return balls + obj.firstInningsBalls;
          } else {
            return balls;
          }
        }, 0);
      team.facedBalls = this.matchResults.filter(each => [each.battingFirst, each.battingSecond].includes(eachTeam))
        .reduce((balls, obj) => {
          if (obj.battingFirst == eachTeam) {
            return balls + obj.firstInningsBalls;
          } else if (obj.battingSecond == eachTeam) {
            return balls + obj.secondInningsBalls;
          } else {
            return balls;
          }
        }, 0);
      team.scoredRuns = this.matchResults.filter(each => [each.battingFirst, each.battingSecond].includes(eachTeam))
        .reduce((runs, obj) => {
          if (obj.battingFirst == eachTeam) {
            return runs + obj.firstInningsScore;
          } else if (obj.battingSecond == eachTeam) {
            return runs + obj.secondInningsScore;
          } else {
            return runs;
          }
        }, 0);
      team.concededRuns = this.matchResults.filter(each => [each.battingFirst, each.battingSecond].includes(eachTeam))
        .reduce((runs, obj) => {
          if (obj.battingFirst == eachTeam) {
            return runs + obj.secondInningsScore;
          } else if (obj.battingSecond == eachTeam) {
            return runs + obj.firstInningsScore;
          } else {
            return runs;
          }
        }, 0);
      team.bowledBallsNRR = this.matchResults.filter(each => [each.battingFirst, each.battingSecond].includes(eachTeam))
        .reduce((balls, obj) => {
          if (obj.battingFirst == eachTeam) {
            return balls + obj.secondInningsBallsForNRR;
          } else if (obj.battingSecond == eachTeam) {
            return balls + obj.firstInningsBallsForNRR;
          } else {
            return balls;
          }
        }, 0);
      team.facedBallsNRR = this.matchResults.filter(each => [each.battingFirst, each.battingSecond].includes(eachTeam))
        .reduce((balls, obj) => {
          if (obj.battingFirst == eachTeam) {
            return balls + obj.firstInningsBallsForNRR;
          } else if (obj.battingSecond == eachTeam) {
            return balls + obj.secondInningsBallsForNRR;
          } else {
            return balls;
          }
        }, 0);
      team.facedOversNRR = ((team.facedBallsNRR - (team.facedBallsNRR % 6)) / 6 + (team.facedBallsNRR % 6) / 6);
      team.bowledOversNRR = ((team.bowledBallsNRR - (team.bowledBallsNRR % 6)) / 6 + (team.bowledBallsNRR % 6) / 6)
      team.nrr = ((team.scoredRuns / team.facedOversNRR) - (team.concededRuns / team.bowledOversNRR));
      return team;
    });
    this.pointsTable.sort((a: any, b: any) => {
      let aValue = ((a.scoredRuns / a.facedBalls) - (a.concededRuns / a.bowledBalls))
      let bValue = ((b.scoredRuns / b.facedBalls) - (b.concededRuns / b.bowledBalls))
      if (aValue < bValue) {
        return -1;
      } else if (a.createdDate > b.createdDate) {
        return 1;
      } else {
        return 0;
      }
    });
    this.dataSource = new MatTableDataSource(this.pointsTable);
  }
  simulatePointsTable(eachScheduledMatch: any, type: string) {
    let value = eachScheduledMatch.homeOversBowled;
    var isError = (typeof (+value) != "number") || (+value < 0) || (+value > 20) || (+(value?.toString().split(".")[1]) > 5);
    if (isError) {
      alert('Please enter valid overs for '+ eachScheduledMatch.homeTeam);
      return;
    }
    eachScheduledMatch.homeOversBowled = eachScheduledMatch.homeOversBowled | 0;
    value = eachScheduledMatch.visitingOversBowled;
    var isError = (typeof (+value) != "number") || (+value < 0) || (+value > 20) || (+(value?.toString().split(".")[1]) > 5);
    if (isError) {
      alert('Please enter valid overs for '+ eachScheduledMatch.visitingTeam);
      return;
    }
    eachScheduledMatch.visitingOversBowled = eachScheduledMatch.visitingOversBowled | 0;
    value = eachScheduledMatch.homeRunsScored;
    var isError = (typeof (+value) != "number") || (+value < 0);
    if (isError) {
      alert('Please enter valid runs for '+ eachScheduledMatch.homeTeam);
      return;
    }
    eachScheduledMatch.homeRunsScored = eachScheduledMatch.homeRunsScored | 0;
  
    value = eachScheduledMatch.visitingRunsScored;
    var isError = (typeof (+value) != "number") || (+value < 0);
    if (isError) {
      alert('Please enter valid runs for '+ eachScheduledMatch.visitingTeam);
      return;
    }
    eachScheduledMatch.visitingRunsScored = eachScheduledMatch.visitingRunsScored | 0; 
    if (type == 'add') {
      if (!eachScheduledMatch.homeTeamWon && !eachScheduledMatch.visitingTeamWon) {
        alert('Please select winning team.');
        return;
      }
      if (eachScheduledMatch.homeTeamWon || eachScheduledMatch.visitingTeamWon) {
        let obj: any = {
          "matchId": eachScheduledMatch.matchId,
          "matchDate": eachScheduledMatch.matchDate,
          "homeTeam": eachScheduledMatch.homeTeam,
          "visitingTeam": eachScheduledMatch.visitingTeam,
          "battingFirst": eachScheduledMatch.homeTeamBattingFirst ? eachScheduledMatch.homeTeam : eachScheduledMatch.visitingTeam,
          "battingSecond": !eachScheduledMatch.homeTeamBattingFirst ? eachScheduledMatch.homeTeam : eachScheduledMatch.visitingTeam,
          "firstInningsScore": eachScheduledMatch.homeTeamBattingFirst ? eachScheduledMatch.homeRunsScored : eachScheduledMatch.visitingRunsScored,
          "secondInningsScore": !eachScheduledMatch.homeTeamBattingFirst ? eachScheduledMatch.homeRunsScored : eachScheduledMatch.visitingRunsScored,
          "firstInningsBalls": eachScheduledMatch.homeTeamBattingFirst ? this.ovrToBalls(eachScheduledMatch.homeOversBowled) : this.ovrToBalls(eachScheduledMatch.visitingOversBowled),
          "secondInningsBalls": !eachScheduledMatch.homeTeamBattingFirst ? this.ovrToBalls(eachScheduledMatch.homeOversBowled) : this.ovrToBalls(eachScheduledMatch.visitingOversBowled),
          "winner": eachScheduledMatch.homeTeamWon ? eachScheduledMatch.homeTeam : eachScheduledMatch.visitingTeam,
          "firstInningsAllOut": eachScheduledMatch.homeTeamBattingFirst ? eachScheduledMatch.homeTeamAllOut : eachScheduledMatch.visitingTeamAllOut,
          "secondInningsAllOut": !eachScheduledMatch.homeTeamBattingFirst ? eachScheduledMatch.homeTeamAllOut : eachScheduledMatch.visitingTeamAllOut,
        }
        obj.firstInningsBallsForNRR = obj.firstInningsAllOut ? 120 : obj.firstInningsBalls;
        obj.secondInningsBallsForNRR = obj.secondInningsAllOut ? 120 : obj.secondInningsBalls;
        this.matchResults.push(obj);
        eachScheduledMatch.isComplete = true;
      }
    } else {
      let idx = this.matchResults.findIndex(e => e.matchId == eachScheduledMatch.matchId);
      this.matchResults.splice(idx, 1);
      eachScheduledMatch.isComplete = false;
    }
    this.pointsTable = [];
    this.generatePointsTable();
    // this.dataSource.sort = this.sort;
    this.dataSource.data.sort((a: any, b: any) => {
      if (a.wins > b.wins) {
        return -1;
      } else if (a.wins < b.wins) {
        return 1;
      } else if (a.wins == b.wins && a.nrr < b.nrr) {
        return 1;
      } else if (a.wins == b.wins && a.nrr > b.nrr) {
        return -1;
      } else {
        return 0;
      }
    });
  }
  ovrToBalls(ovr: any) {
    ovr = ovr.toString();
    let exactOvr = ovr.split('.')[0] * 6;
    let remainingOvr = ovr.split('.')[1] ? +("0." + ovr.split('.')[1] % 6).toString().split('.')[1] : 0;
    return exactOvr + remainingOvr
  }

  public get isMobileWidth() {
    return window.innerWidth < 650;
  }
}