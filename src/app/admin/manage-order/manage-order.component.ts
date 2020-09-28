import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalService } from '../../services/global.service';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.css']
})
export class ManageOrderComponent implements OnInit {

  constructor(
    public globalService: GlobalService,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private parseService: ParseService,
    private toast: ToastrService,
    private authService: AuthService
  ) { }

  loading = false;
  orders = [];
  users = [];
  order_detail = [];
  selected_order: Object;
  price_tbded = false;
  cbm_tbded = false;

  ngOnInit(): void {
    this.globalService.menu = 'manage-order';
    this.get_item();
    this.get_orders();
    this.get_users();
  }

  get_orders = () => {
    this.loading = true;
    this.api.getAllOrders().pipe(first()).subscribe(
      data => {
        if(data['status'] == 'success'){
          this.orders = [...data['data']];
        }else{
          this.toast.error('There had been a database error. Please try again later.', 'Error');
        }
        this.loading = false;
      },
      error => {
        this.toast.error('There had been a database error. Please try again later.', 'Error');
        this.loading = true;
      }
    );
  }
  get_item = () => {
    this.loading = true;
    this.api.getItem().pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          let items = data['data'];
          this.globalService.items = [...items]
        } else {
          this.toast.error('There is an issue with server. Please try again.', 'Error');
        }
        this.loading = false;
      },
      error => {
        console.log(error)
        this.loading = false;
      }
    );
  }
  get_users = () => {
    this.loading = true;
    this.api.getPsUsers().pipe(first()).subscribe(
      data => {
        if(data['status'] == 'success'){
          this.users = [...data['data']];
        }else{
          this.toast.error('There had been a database error. Please try again later.', 'Error');
        }
        this.loading = false;
      },
      error => {
        this.toast.error('There had been a database error. Please try again later.', 'Error');
        this.loading = true;
      }
    );
  }
  get_order_details = (order_id) => {
    this.selected_order = this.orders.filter(item => item['order_id'] == order_id)[0]
    this.order_detail = [];
    this.price_tbded = false;
    this.cbm_tbded = false;
    this.loading = true;
    this.api.getOrderDetails(this.parseService.encode({
      order_id: order_id
    })).pipe(first()).subscribe(
      data => {
        if(data['status'] == 'success'){
          this.order_detail = [...data['data']];
        }else{
          this.toast.error('There had been a database error. Please try again later.', 'Error');
        }
        this.loading = false;
      },
      error => {
        this.toast.error('There had been a database error. Please try again later.', 'Error');
        this.loading = true;
      }
    );
  }
  get_user_name = (id) => {
    if(this.users.length != 0){
      let ret = this.users.filter(item => item['id'] == id)[0];
      return ret['name'];
    }
  }
  parse_float = (val) => {
    return Math.floor(parseFloat(val) * 100) / 100;
  }
  sum_total_price = (ordered_item) => {
    let sum = 0;
    this.price_tbded = false;
    if(ordered_item.length != 0){
      ordered_item.forEach(item => {
        this.globalService.items.forEach(_item => {
          if(item['item_id'] == _item['id']){
            if((_item['price'] != '') && (_item['price'] != 'Market Price')){
              sum += this.parse_float(_item['price']) * item['qty'];
            }else{
              this.price_tbded = true;
            }
          }
        })
      })
    }
    return sum;
  }
  sum_total_cbm = (ordered_item) => {
    let sum = 0;
    this.cbm_tbded = false;
    if(ordered_item.length != 0){
      ordered_item.forEach(item => {
        this.globalService.items.forEach(_item => {
          if(item['item_id'] == _item['id']){
            if(_item['cbm'] != ''){
              sum += this.parse_float(_item['cbm']) * item['qty'];
            }else{
              this.cbm_tbded = true;
            }
          }
        })
      })
    }
    return sum;
  }
}