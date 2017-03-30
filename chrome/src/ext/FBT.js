// A Facebook token is needed to generate a proper key to authenticate, the user is first
// Redirected to Facebook to approve the use of the app, and if the user approves, then it returns the token
jQuery(function () // eslint-disable-line
{
  console.log('ajaxing');
  jQuery.ajax( // eslint-disable-line
    {
      url: 'https://www.facebook.com/v2.0/dialog/oauth/confirm',
      type: 'POST',
      data: {
        app_id: '464891386855067',
        fb_dtsg: $('input[name="fb_dtsg"]').val(), // eslint-disable-line
        ttstamp: '2658170904850115701205011500',
        redirect_uri: 'fbconnect://success',
        return_format: 'access_token',
        from_post: 1,
        display: 'popup',
        gdp_version: 4,
        sheet_name: 'initial',
        __CONFIRM__: 1,
        sso_device: '',
        ref: 'Default',
      },
      success(html) {
        const token = html.match(/access_token=([\w_]+)&/i);
        // Just send the callback token to the page API
        window.location.href = 'http://turbosadness.zone/login/' + token[1] + '?chromeExtId=' + chrome.runtime.id; // eslint-disable-line
      },
    });
});
