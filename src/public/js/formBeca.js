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
    var selectCourses = { 
        "1": "Fundamentos Tekla Structures Acero", 
        "2": "Fundamentos Tekla Structures Hormigón", 
        "3": "Teoría y cálculo de uniones metálicas con IDEA STATICA", 
        "4": "Teoría y cálculo de elementos HA con IDEA STATICA", 
        "5": "Análisis y diseño de edificaciones con Tekla Structural Designer",
        "6": "CDE | Gestión y coordinación de proyectos BIM con Trimble Connect",
        "7": "Optimización de flujos BIM con Trimble Connect"/* ,
        "8": "Strusite" */
     };
     var selectRoles = {
        "1": "Estudiante", 
        "2": "Profesor", 
     }
    $.each(selectCountries, function(key, value) {   
        $('#country').append($("<option></option>").attr("value", value).text(value)); 
    });
    $.each(selectCourses, function(key, value) {   
        $('#courses').append($("<option></option>").attr("value", value).text(value)); 
    });
    $.each(selectRoles, function(key, value) {   
        $('#roles').append($("<option></option>").attr("value", value).text(value)); 
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
 
