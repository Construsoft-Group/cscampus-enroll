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
        "2": "Belice", 
        "3": "Bolivia", 
        "4": "Brasil", 
        "5": "Chile",
        "6": "Colombia",
        "7": "Costa Rica",
        "8": "Cuba",
        "9": "Ecuador",
        "10": "El Salvador",
        "11": "España",
        "12": "Guatemala",
        "13": "Haití",
        "14": "Honduras",
        "15": "Jamaica",
        "16": "México",
        "17": "Nicaragua",
        "18": "Panamá",
        "19": "Paraguay",
        "20": "Perú",
        "21": "República dominicana",
        "22": "Uruguay",
        "23": "Otro"
     };
    var selectCourses = { 
        "1": "Fundamentos Tekla Structures Acero", 
        "2": "Fundamentos Tekla Structures Hormigón", 
        "3": "Teoría y cálculo de uniones metálicas con IDEA STATICA", 
        "4": "Teoría y cálculo de elementos HA con IDEA STATICA", 
        "5": "Análisis y diseño de edificaciones con Tekla Structures Designer",
        "6": "Common Data Environment con Trimble Connect",
        "7": "Optimización de flujos BIM con Trimble Connect"
     };
    $.each(selectCountries, function(key, value) {   
        $('#country').append($("<option></option>").attr("value", key).text(value)); 
    });
    $.each(selectCourses, function(key, value) {   
        $('#courses').append($("<option></option>").attr("value", value).text(value)); 
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
    studentForm.trigger('submit', [true]);
}





/* $(document).on("click", "#validation", function() {
    const phoneNumber = phoneInput.getNumber();
    document.getElementById('phone').value = phoneNumber;
    var option = document.getElementById('radioOption');

   if(!option.checked){
        //alert("Es necesario aprobar los términos y condiciones.");
        $('#strengthMessage').text("Debes aprobar los términos y condiciones");
        $('#strengthMessage').addClass('alert alert-danger');
    } else {
        //alert("Check ok");
        $('#strengthMessage').text("Solicitud enviada");
        $('#strengthMessage').removeClass();
        $('#strengthMessage').addClass('alert alert-success');
        document.getElementById('send').click();
        //document.getElementById('captcha').click();
        //document.getElementById('newStudent').submit()
    }
}); */


 
