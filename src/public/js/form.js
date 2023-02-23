const phoneInputField = document.querySelector("#phone");
const info = document.querySelector(".alert-info");

const phoneInput = window.intlTelInput(phoneInputField, { preferredCountries: ["es", "co", "cl", "pe", "ar"],
    utilsScript:
    "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
});

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
        $('#course').append($("<option></option>").attr("value", key).text(value)); 
    });
    /*$('#txtPassword').keyup(function () {
        $('#strengthMessage').html(checkStrength($('#txtPassword').val()))
    })
     function checkStrength(password) {
        var strength = 0
        if (password.length < 6) {
            $('#strengthMessage').removeClass()
            $('#strengthMessage').addClass('Short')
            return 'Too short'
        }
        if (password.length > 7) strength += 1
        // If password contains both lower and uppercase characters, increase strength value.
        if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 1
        // If it has numbers and characters, increase strength value.
        if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)) strength += 1
        // If it has one special character, increase strength value.
        if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1
        // If it has two special characters, increase strength value.
        if (password.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1
        // Calculated strength value, we can return messages
        // If value is less than 2
        if (strength < 2) {
            $('#strengthMessage').removeClass()
            $('#strengthMessage').addClass('Weak')
            return 'Weak'
        } else if (strength == 2) {
            $('#strengthMessage').removeClass()
            $('#strengthMessage').addClass('Good')
            return 'Good'
        } else {
            $('#strengthMessage').removeClass()
            $('#strengthMessage').addClass('Strong')
            return 'Strong'
        }
    } */
});

$(document).on("click", "#send", function() {
    const phoneNumber = phoneInput.getNumber();
    document.getElementById('phone').value = phoneNumber;
    var option = document.getElementById('radioOption');
    if(!option.checked){
        alert("Es necesario aprobar los términos y condiciones.");
        console.log("Es necesario aprobar los términos y condiciones.")
    } else {
        alert("Check ok");
        document.getElementById('newStudent').submit()
    }
});

