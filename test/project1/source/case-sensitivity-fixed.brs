sub error1()
    a = 1
    print a ' error
    print "a="; a ' error
    some(a) ' error
    some(1 + a) ' error
end sub

sub error2()
    a = 1
    a = 2 ' error
end sub

sub error3(A)
    A = 2 ' error
end sub

sub ok1()
    A = 1
    print A
    print "A="; A
    some(A)
    some(1 + A)
end sub

sub some(p)
    print p
end sub
