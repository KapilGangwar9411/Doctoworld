import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrls: ['./read.component.scss']
})
export class ReadComponent implements OnInit {
  headingKey = "privacy_policy";
  textToRead = "";

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let what: string = params["what"];
      this.headingKey = what;
      switch (this.headingKey) {
        case "privacy_policy":
          this.textToRead = Helper.getSetting("privacy_policy") ?? "";
          break;
        case "terms_and_conditions":
          this.textToRead = Helper.getSetting("terms") ?? "";
          break;
        case "about":
          this.textToRead = Helper.getSetting("about_us") ?? "";
          break;
      }
    });
  }

}
