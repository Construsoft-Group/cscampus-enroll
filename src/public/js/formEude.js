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
    var corporateEmailRegex = /^[a-zA-Z0-9._%+-]+@(?!gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|vodafone\.com|movistar\.com|telefonica\.com|live\.com|msn\.com|google\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

   if(email == emailConfirm){
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
 
