
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
        "2": "Bolivia",  
        "3": "Chile",
        "4": "Colombia",
        "5": "Ecuador",
        "6": "España",
        "7": "Paraguay",
        "8": "Peru",
        "9": "Spain",
        "10": "Uruguay",
        "11": "Venezuela"
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

    var selectCourses = {
        "1": "Fundamentos Tekla Structures Acero", 
        "2": "Fundamentos Tekla Structures Hormigón", 
        "3": "Detallado de Elementos Prefabricados en Tekla Structures", 
        "4": "Componentes Personalizados en Tekla Structures",
        "5": "Editor de cuadros en Tekla Structures",
        "6": "Gestión de la numeración de Tekla Structures",
        "7": "Macros de Construsoft para Tekla Structures",
        "8": "Common Data Environment con Trimble Connect",
        "9": "Optimización de flujos BIM con Trimble Connect"
    }

    $.each(selectCountries, function(key, value) {   
        $('#country').append($("<option></option>").attr("value", value).text(value)); 
    });
    /*
    $.each(selectPosition, function(key, value) {   
        $('#position').append($("<option></option>").attr("value", value).text(value)); 
    });
    */
    $.each(selectActivity, function(key, value) {   
        $('#activity').append($("<option></option>").attr("value", value).text(value)); 
    });
    $.each(selectCourses, function(key, value) {   
        $('#courseName').append($("<option></option>").attr("value", value).text(value)); 
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
    var email = $('#email').val();
    var emailConfirm = $('#emailConfirm').val();
    //console.log(email.value)
    //console.log(emailConfirm.value)
    // Expresión regular para verificar si el dominio del correo es corporativo
    var corporateEmailRegex = /^[a-zA-Z0-9._%+-]+@(?!gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|vodafone\.com|movistar\.com|telefonica\.com|live\.com|msn\.com|google\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

   if(email == emailConfirm){
    $('#strengthMessage').text("");
    $('#strengthMessage').removeClass();
    return true;
    /*
    if (corporateEmailRegex.test(email)) {
        $('#strengthMessage').text("");
        $('#strengthMessage').removeClass();
        return true;
    } else {
        $('#strengthMessage').text("Por favor, utiliza una cuenta de correo corporativa.");
        $('#strengthMessage').addClass('alert alert-danger');
        return false;
    }
    */
    } else {
        $('#strengthMessage').removeClass();
        $('#strengthMessage').text("Los campos email deben coincidir");
        $('#strengthMessage').addClass('alert alert-danger');
        return false;
    }
}
 
