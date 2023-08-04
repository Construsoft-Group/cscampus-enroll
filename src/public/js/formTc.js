const phoneInputField = document.querySelector("#phone");
const info = document.querySelector(".alert-info");

const phoneInput = window.intlTelInput(phoneInputField, { preferredCountries: ["es", "co", "cl", "pe", "ar"],
    utilsScript:
    "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
});

var studentForm = jQuery("#newStudent");

 $(document).on("click", "#valNumber", async function() {
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };
      
      const res = await fetch("https://strusite.com/webservice/rest/server.php?wstoken=36ddb8e5d89751889830901e8952b046&wsfunction=core_session_time_remaining", requestOptions);
      var body = await res.text();
      console.log(body);
});

$(document).ready(function () {
    var selectCountries = { 
        "1": "Argentina", 
        "2": "Belize", 
        "3": "Bolivia", 
        "4": "Brazil", 
        "5": "Chile",
        "6": "Colombia",
        "7": "Costa Rica",
        "8": "Cuba",
        "9": "Dominican Republic",
        "10": "Ecuador",
        "11": "El Salvador",
        "12": "Guatemala",
        "13": "Haití",
        "14": "Honduras",
        "15": "Jamaica",
        "16": "Mexico",
        "17": "Nicaragua",
        "18": "Panama",
        "19": "Paraguay",
        "20": "Peru",
        "21": "Spain",
        "22": "Uruguay",
        "23": "Venezuela"
     };
    var selectCategories = {
    "1": "Administración / Institución pública",
    "2": "Promotor / Dueño de proyecto",
    "3": "Constructora / Ingenieria",
    "4": "Otro"
    }
    var selectActivity = { 
    "1": "Centro educativo", 
    "2": "Construcciones metálicas", 
    "3": "Constructora", 
    "4": "Hormigón In-situ",
    "5": "Hormigón prefabricado",
    "6": "Ingeniería",
    "7": "Madera",
    "8": "Otro"

    };
    var selectPosition = { 
    "1": "General Director", 
    "2": "Technical Manager", 
    "3": "Logistics Manager", 
    "4": "Production Manager",
    "5": "IT Manager",
    "6": "BIM Manager",
    "7": "Technical Office",
    "8": "Draftman",
    "9": "Calculator",
    "10": "Modeler",
    "11": "Production Dept",
    "12": "Purchasing Dept",
    "13": "Logistics Dept",
    "14": "IT Dept",
    "15": "Secretary",
    "16": "Teacher",
    "17": "Student"
    };


    $.each(selectCountries, function(key, value) {   
        $('#country').append($("<option></option>").attr("value", value).text(value)); 
    });
    $.each(selectCategories, function(key, value) {   
        $('#category').append($("<option></option>").attr("value", value).text(value)); 
    });
    $.each(selectActivity, function(key, value) {   
        $('#activity').append($("<option></option>").attr("value", value).text(value)); 
    });
    $.each(selectPosition, function(key, value) {   
        $('#position').append($("<option></option>").attr("value", value).text(value)); 
    });
});


$(studentForm).on('submit', function (e, skipRecaptcha) {
    if(skipRecaptcha) {
        return;
    }
    e.preventDefault();
    grecaptcha.execute();
});

function submitStudentForm() {
    const phoneNumber = phoneInput.getNumber();
    document.getElementById('phone').value = phoneNumber;
    studentForm.trigger('submit', [true]);
}


function validar() {
    var email = document.getElementById('email');
    var emailConfirm = document.getElementById('emailConfirm');
    console.log(email.value)
    console.log(emailConfirm.value)
   if(email.value == emailConfirm.value){
        $('#strengthMessage').text("");
        $('#strengthMessage').removeClass();
        return true;
    } else {
        $('#strengthMessage').removeClass();
        $('#strengthMessage').text("Los campos email deben coincidir");
        $('#strengthMessage').addClass('alert alert-danger');
        return false;
    }
}