export class Item {
  inventory_id: string = ''
  created_user_id: string
  branch: string = ''
  gross_weight: string = ''
  category: string = 'dry'
  vendor_description: string = ''
  description: string = ''
  image: any = []
  packing_info: string = ''
  uom: string = ''
  price: string = ''
  cbm: string = ''
  qty: string = ''
  moq: string = ''
  status: any = true
  qty_display: any = true
  user_access: string = 'all'

  public reset(){
    this.inventory_id = ''
    this.created_user_id = ''
    this.branch = ''
    this.gross_weight = ''
    this.category = 'dry'
    this.vendor_description = ''
    this.description = ''
    this.image = ''
    this.packing_info = ''
    this.uom = ''
    this.price = ''
    this.cbm = ''
    this.qty = ''
    this.moq = ''
    this.status = ''
    this.qty_display = ''
    this.user_access = 'all'
  }
}
