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
    Rnd(sub ()
        return a 'error
    end sub)
end sub
