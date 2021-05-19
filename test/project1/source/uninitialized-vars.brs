sub error1()
    print a ' error
end sub

sub error2()
    print ("2*a=" + (2 * a)) ' error
end sub

sub error3()
    Rnd(a) ' error
end sub

sub error4()
    a = 1
    Rnd(function ()
        return a 'error
    end function)
end sub
