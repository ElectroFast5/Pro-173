var houseNumber = null

AFRAME.registerComponent("markerhandler", {
  init: async function () {

    if (addressNumber == null) {
      this.askAddressNumber();
    }

    //get the toys collection from firestore database
    var toys = await this.getToys()

    //markerFound event
    this.el.addEventListener("markerFound", () => {
      var markerId = this.el.id      
      this.handleMarkerFound(toys, markerId)
    })

    //markerLost event
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost()
    })

  },

  askAddressNumber: function() {
    var iconUrl = "https://raw.githubusercontent.com/ElectroFast5/Pro-170/main/pattern-Train%202.png"

    swal({
      title: "Welcome to ExpensiveToys",
      icon: iconUrl,
      content: {
        element: "input",
        attributes : {
          placeholder: "Please type your adrress",
          type: "number",
          min: 1
        }
      },
      closeOnClickOutside: false,
    }).then((x)=>{
      addressNumber = x
    })
  },

  handleMarkerFound: function (toys, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    
    // Sunday - Saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    var toy = toys.filter(toy => toy.id === markerId)[0];

    if (toy.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is not available today!!!",
        timer: 2500,
        buttons: false
      });
    } else {
       // Changing Model scale to initial scale
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      //Update UI conent VISIBILITY of AR scene(MODEL , INGREDIENTS & PRICE)
      model.setAttribute("visible", true)

      var ingredientsContainer = document.querySelector(`#main-plane-${toy.id}`)
      ingredientsContainer.setAttribute("visible", true)

      var price = document.querySelector(`#price-plane-${toy.id}`)
      price.setAttribute("visible", true)

      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");

      var payButton = document.getElementById("pay-button")

      // Handling Click Events
      ratingButton.addEventListener("click", function() {
        swal({
          icon: "warning",
          title: "Rate Toy",
          text: "Work In Progress"
        });
      });

      orderButtton.addEventListener("click", () => {
        var aNumber
        addressNumber<=9?(aNumber=`T0${addressNumber}`):`T${addressNumber}`
        this.handleOrder(aNumber, toy)

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "Your order will serve soon on your table!",
          timer: 2000,
          buttons: false
        });
      });

      orderSummaryButtton.addEventListener("click", () =>{
        this.handleOrderSummary()
      })

      payButton.addEventListener("click", ()=> {
        this.handlePayment()
      })
    }
  },
  handleOrder: function(aNumber, toy) {
    firebase.firestore().collection("orders").doc(aNumber).get().then((doc)=> {
      var details = doc.data()
      if(details["current_basket"][toy.id]){
        details["current_basket"][toy.id]["quantity"]+=1
        var currentQuatity = details["current_basket"][toy.id]["quantity"]
        details["current_basket"][toy.id]["subtotal"] = currentQuatity * toy.price
      } else{
        details["current_basket"][toy.id] = {
          item: toy.toy_name,
          price: toy.price,
          quantity: 1,
          subtotal: toy.price
        }
      }
      details.total_bill += toy.price
      firebase.firestore().collection("tables").doc(doc.id).update(details)
    })
  },

  getOrderSummary: async function (aNumber) {
    return await firebase
      .firestore()
      .collection("tables")
      .doc(aNumber)
      .get()
      .then(doc => doc.data());
  },

  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div")
    buttonDiv.style.display = "none"
  },

  handleOrderSummary: async function () {

    //Getting Table Number
    var aNumber;
    addressNumber <= 9 ? (aNumber = `T0${addressNumber}`) : `T${addressNumber}`;

    //Getting Order Summary from database
    var orderSummary = await this.getOrderSummary(aNumber);

    //Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    //Get the table element
    var tableBodyTag = document.getElementById("bill-table-body");

    //Removing old tr(table row) data
    tableBodyTag.innerHTML = "";

    //Get the cuurent_orders key 
    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      //Create table row
      var tr = document.createElement("tr");

      //Create table cells/columns for ITEM NAME, PRICE, QUANTITY & TOTAL PRICE
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      //Add HTML content 
      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      //Append cells to the row
      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      //Append row to the table
      tableBodyTag.appendChild(tr);
    });

    var totalTR = document.createElement("tr")
    var td1 = document.createElement("td")
    td1.setAttribute("class", "no-line")
    var td2 = document.createElement("td")
    td2.setAttribute("class", "no-line")
    var td3 = document.createElement("td")
    td3.setAttribute("class", "no-line text-center")
    var strongTag = document.createElement("strong")
    strongTag.innerHTML = "total"
    td3.appendChild(strongTag)
    var td4 = document.createElement("td")
    td4.setAttribute("class", "no-line text-right")
    td4.innerHTML = "£" + orderSummary.total_bill
    totalTR.appendChild(td1)
    totalTR.appendChild(td2)
    totalTR.appendChild(td3)
    totalTR.appendChild(td4)
    tableBodyTag.append(totalTR)
  },

  handlePayment: function () {
    document.getElementById("modal-div").style.display = "none"
    var aNumber
    addressNumber <= 9 ? (aNumber = `T0${addressNumber}`) : `T${addressNumber}`
    firebase.firestore().collection("tables").doc(aNumber).update({
      current_orders:{},
      total_bill: 0
    }).then(()=>{swal({
      icon: "success",
      title: "Thank you so much for ur money!",
      text: "Enjoy da toy!🚂🚂🚂",
      timer: 2500,
      buttons: false
    })})
  },

  handleRatings: async function (dish) {
    var aNumber;
    addressNumber <= 9 ? (aNumber = `T0${addressNumber}`) : `T${addressNumber}`;
    var orderSummary = await this.getOrderSummary(aNumber)
    var currentOrders = Object.keys(orderSummary.current_orders)
    if(currentOrders.length > 0 && currentOrders == toy.id) {
      document.getElementById("rating-modal-div").style.display = "flex"
      document.getElementById("rating-input").value = "0"
      document.getElementById("feedback-input").value = ""
      var saveRatingButton = document.getElementById("save-rating-button")
      saveRatingButton.addEventListener("click", ()=>{
        document.getElementById("rating-modal-div").style.display = "none"
        var rating = document.getElementById("rating-input").value
        var feedback = document.getElementById("feedback-input").value
        firebase.firestore().collection("dishes").doc(dish.id).update({
          last_review: feedback,
          last_rating: rating
        }).then(()=>{
          swal({
            icon: "success",
            title: "Thanks for being so kind to rate our toy! 👍👍👍",
            text: "We really hope you liked the toy and will play with it a lot",
            timer: 2500,
            buttons: false
          })
        }) 
      })
    } else {
      swal({
        icon: "warning",
        title: "Uh-Oh - it didn't work! ⚠⚠⚠",
        text: "You didn't give us any toy to rate.😢",
        timer: 2500,
        buttons: false
      })
    }
  },

  //get the toys collection from firestore database
  getToys: async function () {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data())
      })
  }
})
