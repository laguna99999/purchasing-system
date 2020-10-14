import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';
import { Item } from '../../admin/item/item';
import * as moment from 'moment';
import * as XLSX from 'xlsx';

import { GlobalService } from '../../services/global.service'

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {

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
  item_display_style = 'list';
  category: string = 'all';
  ticket_created: boolean = false;

  ordered_item: Array<Object> = [];

  selected_item: Object;
  selected_ordered_item: Object;

  selected_order: Object;

  qty: number = 1;

  ordered_item_details: Array<Object> = [];


  po_number: String = '';
  order_selected: boolean = false;

  price_tbded: boolean = false;
  cbm_tbded: boolean = false;

  user: Object;

  search_key = '';

  ngOnInit(): void {
    this.globalService.menu = 'order';
    this.user = this.authService.currentUser();
    this.getItem();
    this.getOrders(this.user['id']);
  }
  category_change = (event) => {
    this.category = event.target.value;
  }
  item_display_style_change = (style) => {
    this.item_display_style = style;
  }
  getItem = () => {
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
  getOrders = (user_id) => {
    this.loading = true;
    this.api.getOrders(this.parseService.encode({
      customer_id: user_id,
      limit: 8
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          let orders = data['data'];
          this.globalService.orders = [...orders];
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
  generate_po_number = () => {
    this.po_number = this.user['name'] + moment().format('hhmmssMMDDYYYY');
  }
  create_ticket = () => {
    this.ticket_created = true;
  }
  select_item = (item) => {
    this.selected_item = item;
  }
  increase_item = () => {
    this.qty++;
  }
  decrease_item = () => {
    if(this.qty > 1){
      this.qty--;
    }
  }
  manual_input_item = (event) => {
    this.qty = event.target.value;
  }
  add_item = () => {
    if(this.ticket_created){
      let flag = false;
      this.ordered_item.forEach(item => {
        if(item['item_id'] == this.selected_item['id']){
          flag = true;
        }
      })
      if(flag){
        this.ordered_item.forEach(item => {
          if(item['item_id'] == this.selected_item['id']){
            item['qty'] += this.qty;
          }
        })
      }else{
        this.ordered_item.push({
          item_id: this.selected_item['id'],
          qty: this.qty
        })
      }
    }else{
      this.toast.error('You need to create a new order before adding items.', 'Error');
    }
    this.reset();
  }
  edit_item = (id) => {
    this.reset();
    this.selected_item = this.globalService.items.filter(item => item['id'] == id)[0];
    this.qty = this.ordered_item.filter(item => item['item_id'] == id)[0]['qty'];
  }
  edit_item_confirm = () => {
    this.ordered_item.map(item => {
      if(item['item_id'] == this.selected_item['id']){
        item['qty'] = this.qty;
      }
    })
    this.reset();
  }
  remove_item = () => {
    this.ordered_item = [...this.ordered_item.filter(item => item['item_id'] != this.selected_item['id'])];
    this.reset();
  }
  clear_items = () => {
    this.ordered_item = [];
    this.reset();
  }
  cancel_order = () => {
    this.ticket_created = false;
    this.ordered_item = [];
    this.reset();
  }
  confirm_order = () => {
    if(this.ordered_item.length == 0){
      this.toast.error('No items added. Please add items.', 'Error');
    }else{
      this.place_order(this.ordered_item);
      this.ordered_item = [];
      this.ticket_created = false;
      this.reset();
    }
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
  parse_float = (val) => {
    return Math.floor(parseFloat(val) * 100) / 100;
  }
  parse_int = (val) => {
    return parseInt(val);
  }
  reset = () => {
    this.selected_item = null;
    this.qty = 1;
  }
  place_order = (items) => {
    this.loading = true;
    this.api.addOrder(this.parseService.encode({
      customer_id: this.user['id'],
      order_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      order_id: this.po_number,
      items: JSON.stringify(items)
    })).pipe(first()).subscribe(data => {
      if(data['data'] == true){
        this.toast.success('Your order has been placed successfully.', 'Success');
        this.getOrders(this.user['id']);
      }
      this.loading = false;
    }, error => {
      this.loading = false;
      this.toast.error('There is an issue with server. Please try again after refreshing browser.', 'Error');
    });
    //this.extract_to_excel();
    this.api.sendMail(this.parseService.encode({
      to: this.user['email'],
      subject: "Your order has been placed successfully",
      message: "Order details will be attached."
    })).pipe(first()).subscribe(data => {
      if(data['data'] == true){
        this.toast.success('Your order has been placed successfully.', 'Success');
        this.getOrders(this.user['id']);
      }
      this.loading = false;
    }, error => {
      this.loading = false;
      this.toast.error('There is an issue with server. Please try again after refreshing browser.', 'Error');
    });
  }
  select_order = (order_id) => {
    this.selected_order = this.globalService.orders.filter(item => item['order_id'] == order_id)[0];
    this.ordered_item_details = [];
    this.loading = true;
    this.api.getOrderDetails(this.parseService.encode({
      order_id: order_id
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.ordered_item_details = [...data['data']];
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
  search_item = (event) => {
    this.search_key = event.target.value;
  }
  filter_item = (item) => {
    if(this.search_key == ''){
      return true;
    }else{
      if((item['description'].toLowerCase().indexOf(this.search_key.toLowerCase()) != -1) || (item['vendor_description'].toLowerCase().indexOf(this.search_key.toLowerCase()) != -1)){
        return true;
      }
      return false;
    }
  }
  export_excel = () => {
    /* table id is passed over here */
    let element = document.getElementById('export-table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file */
    XLSX.writeFile(wb, `${this.po_number}.xlsx`);
  }
  extract_to_excel = () => {
    /* table id is passed over here */
    let element = document.getElementById('export-table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file */
    //console.log(wb)
    XLSX.writeFile(wb, `${this.po_number}.xlsx`);
  }
}
