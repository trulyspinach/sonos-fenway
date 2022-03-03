function createXHR() 
{
    var request = false;
        try {
            request = new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch (err2) {
            try {
                request = new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch (err3) {
		try {
			request = new XMLHttpRequest();
		}
		catch (err1) 
		{
			request = false;
		}
            }
        }
    return request;
}

function loadHTML(url, callback, arg)
{    
    var xhr = createXHR();
    
    xhr.onreadystatechange=function() {
        if(xhr.readyState == 4) {
            callback(arg, xhr.responseText);
        } 
    }; 
    
    // KLUDGE: Force IEEEEEEEEE to not cache my dynamic request
    var d = new Date();
    url   = url + "&time=" + d.getTime();

    xhr.open("GET", url, true);
    xhr.send(null);
}
