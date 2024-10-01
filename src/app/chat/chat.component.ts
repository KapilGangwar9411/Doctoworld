import { Component, Input, ViewChild } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import * as firebase from 'firebase';
import { Chat } from 'src/models/chat.models';
import { Constants } from 'src/models/constants.models';
import { Helper } from 'src/models/helper.models';
import { Message } from 'src/models/message.models';
import { User } from 'src/models/user.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {

  
  @ViewChild("myContent", { static: true }) myContent: any;
  userMe = new User();
  chatChild!: string;
  userPlayerId!: string;
  newMessageText!: string;
  private chatRef!: firebase.database.Reference;
  private inboxRef!: firebase.database.Reference;
  private unReadIndicationRef!: firebase.database.Reference;
  private ap_id!: number;
  messages = new Array<Message>();
  chatObj = new Chat();

  private doctor_user!: User;
  private delivery_user!: User;
  @Input() public chatDetails: any;

  constructor(private uiElementService: UiElementsService,private modalService: NgbModal, private activeModal: NgbActiveModal,
    private translate: TranslateService, private apiService: ApiService) { }

  ngOnInit() {
    if (this.chatDetails) {
      this.chatObj = this.chatDetails.chat;
      this.doctor_user = this.chatDetails.doctor_user;
      this.delivery_user = this.chatDetails.delivery_user;
      this.ap_id = this.chatDetails.ap_id;
      if (!this.ap_id) this.ap_id = -1;
      // console.log("chat",this.chatObj,this.delivery_user)

      this.userMe = this.apiService.getUserMe();
      this.chatChild = Helper.getChatChild(this.chatObj.myId, this.chatObj.chatId);

      const component = this;
      this.unReadIndicationRef = firebase.database().ref(Constants.REF_INDICATION);
      this.inboxRef = firebase.database().ref(Constants.REF_INBOX);
      this.chatRef = firebase.database().ref(Constants.REF_CHAT);

      //MARK READ FOR THIS CONVERSATION
      this.unReadIndicationRef.child(this.chatObj.myId).child(String(this.ap_id)).remove();
      //LOAD MESSAGES
      this.chatRef.child(this.chatChild).limitToLast(20).on("child_added", function (snapshot, prevChildKey) {
        var newMessage = snapshot.val() as Message;
        if (newMessage) {
          newMessage.timeDiff = Helper.formatMillisDateTimeWOYear(Number(newMessage.dateTimeStamp), Helper.getLocale());
          component.addMessage(newMessage);
          component.markDelivered();
          component.scrollList();
        }
      }, function (error: any) {
        console.error("child_added", error);
      });

      firebase.database().ref(Constants.REF_USERS_FCM_IDS).child(this.chatObj.chatId).once("value", function (snap) {
        component.userPlayerId = snap.val();
      });

      this.translate.get("just_moment").subscribe(value => this.uiElementService.showSuccessToastr(value));

    }
  }
  
  close() {
    this.activeModal.close();
  }

  ngOnDestroy() {
    //MARK READ FOR THIS CONVERSATION
    this.unReadIndicationRef.child(this.chatObj.myId).child(String(this.ap_id)).remove();
  }

  scrollList() {
    this.myContent.scrollToBottom(300);
  }

  markDelivered() {
    if (this.messages && this.messages.length) {
      if (this.messages[this.messages.length - 1].senderId != this.chatObj.myId) {
        this.messages[this.messages.length - 1].delivered = true;
        this.chatRef.child(this.chatChild).child(this.messages[this.messages.length - 1].id).child("delivered").set(true);
      }
      // else {
      //   let toNotify;
      //   if (!this.messages[this.messages.length - 1].delivered) {
      //     toNotify = this.messages[this.messages.length - 1];
      //     this.messages[this.messages.length - 1].delivered = true;
      //   }
      //   if (toNotify) {
      //     this.notifyMessages(toNotify);
      //   }
      // }
    }
  }

  addMessage(msg: Message) {
    this.messages = this.messages.concat(msg);
    //this.storage.set(Constants.KEY_MESSAGES + this.chatChild, this.messages);
    // if (this.chatObj && msg) {
    //   let isMeSender = msg.senderId == this.chatObj.myId;
    //   this.chatObj.chatImage = isMeSender ? msg.recipientImage : msg.senderImage;
    //   this.chatObj.chatName = isMeSender ? msg.recipientName : msg.senderName;
    //   //this.chatObj.chatStatus = isMeSender ? msg.recipientStatus : msg.senderStatus;
    // }
  }

  send() {
    if (this.newMessageText && this.newMessageText.trim().length) {
      let toSend = new Message();
      toSend.chatId = this.chatChild;
      toSend.body = this.newMessageText;
      toSend.dateTimeStamp = String(new Date().getTime());
      toSend.delivered = false;
      toSend.sent = true;
      toSend.recipientId = this.chatObj.chatId;
      toSend.recipientImage = this.chatObj.chatImage;
      toSend.recipientName = this.chatObj.chatName;
      toSend.recipientStatus = this.chatObj.chatStatus;
      toSend.senderId = this.chatObj.myId;
      toSend.senderName = this.userMe.name;
      toSend.senderImage = (this.userMe.image_url && this.userMe.image_url.length) ? this.userMe.image_url : "assets/images/empty_dp.png";
      toSend.senderStatus = this.userMe.email;
      toSend.id = String(this.chatRef.child(this.chatChild).push().key);
      this.newMessageText = '';
      this.chatRef.child(this.chatChild).child(toSend.id).set(toSend).then(res => {
        this.unReadIndicationRef.child(toSend.recipientId).child(String(this.ap_id)).set({ "indication_id": String(this.ap_id), "indication_msg_id": toSend.id, "indication_sender_id": String(toSend.senderId) });
        this.inboxRef.child(toSend.recipientId).child(toSend.senderId).set(toSend);
        this.inboxRef.child(toSend.senderId).child(toSend.recipientId).set(toSend);
        // this.newMessageText = '';
        this.notifyMessages();
      });
    } else {
      this.translate.get("type_message").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  private notifyMessages() {
    this.translate.get(["msg_new", "msg_detail"]).subscribe(values => this.apiService.postNotificationContent((this.doctor_user ? Constants.ROLE_DOCTOR : Constants.ROLE_DELIVERY), Number(this.chatObj.chatId) ? this.chatObj.chatId : this.chatObj.chatId.substring(0, this.chatObj.chatId.indexOf((this.doctor_user ? Constants.ROLE_DOCTOR : Constants.ROLE_DELIVERY))), values["msg_new"], (values["msg_detail"] + " " + this.userMe.name)).subscribe(res => console.log("notiS", res), err => console.log("notiF", err)));
  }

}

