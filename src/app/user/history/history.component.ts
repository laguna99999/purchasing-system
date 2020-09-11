import { Component, OnInit } from '@angular/core';

import { GlobalService } from '../../services/global.service'

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  constructor(private globalService: GlobalService) { }

  ngOnInit(): void {
    this.globalService.menu = 'history';
  }

}
